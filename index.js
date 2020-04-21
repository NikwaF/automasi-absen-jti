const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');
const readline = require('readline');

const getCookieLoginPage = () => new Promise((resolve,reject) => {
  fetch('http://jti.polije.ac.id/elearning/login/index.php', {
    method: 'GET'
  })
  .then(async res => {
    const $ = cheerio.load(await res.text());
    const cookie = res.headers.raw()['set-cookie'];
    const result = {
      cookie,
      token: $('input[name="logintoken"]').attr('value')   
    }
    resolve(result);
  })
    .catch(err => reject(err))
  });


const login = (nim,pass,cookie,token) => new Promise((resolve,reject) => {
  fetch('http://jti.polije.ac.id/elearning/login/index.php', {
    method: 'POST',
    redirect: "manual-dont-change",
    follow: 20,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:75.0) Gecko/20100101 Firefox/75.0",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": cookie,
      "Upgrade-Insecure-Requests": 1      
    },
    body: `username=${nim}&password=${pass}&anchor=&logintoken=${token}`
  })
  .then(async res => {
    const result = {
      url: await res.url,
      cookie: await res.headers.raw()['set-cookie']
    };

    resolve(result);
  })
  .catch(err => reject(err))
}); 

 const pageMy = (cookie) => new Promise((resolve, reject) => {
  fetch('http://jti.polije.ac.id/elearning/my/', {
    method: 'GET',
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:75.0) Gecko/20100101 Firefox/75.0",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      Cookie: cookie,
      "Upgrade-Insecure-Requests": 1
    }
  })
  .then(async res => {
    const $ = cheerio.load(await res.text());
    const nama = $('.dropdown-toggle.usermendrop').text().trim();
    const seskey = $('input[name="sesskey"]').attr('value');   
    const result = {
      nama,seskey
    }
    
    resolve(result);
  })
  .catch(err => reject(err))  
 });


 const eventPage = (cookie) => new Promise((resolve, reject) => {
  fetch('http://jti.polije.ac.id/elearning/calendar/view.php', {
    method: 'GET',
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:75.0) Gecko/20100101 Firefox/75.0",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      Cookie: cookie,
      "Upgrade-Insecure-Requests": 1
    }
  })
  .then(async res => {
    const $ = cheerio.load(await res.text());
    const linknya = $('div.calendar_event_attendance>a'); 
    const link_absen = [];
    for(let i= 0; i <= linknya.length -1 ; i++){
      link_absen.push(linknya[i].attribs.href);
    }

    const tampung = [];
    $('div.calendar_event_attendance>a').each(function(index,item){
      const obj = {};
      obj['link'] = $(this).attr('href'); 

      if($(this).next('div').children('a').length){
        obj['matkul'] = $(this).next('div').children('a').text();
      } else{
        obj['matkul'] = "gak tau";
      }

      $(this).parent().parent().children('.card-header').find('span.date.pull-xs-right').each(function(index2,item2){
        obj['waktu'] = $(this).text();
        tampung.push(obj);
      });
    });
    
    resolve(tampung)
  })
  .catch(err => reject(err))  
 });


 const cekAbsen = (link, cookie) => new Promise((resolve,reject) => {
  fetch(link, {
    method: 'GET',
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:75.0) Gecko/20100101 Firefox/75.0",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      Cookie: cookie,
      "Upgrade-Insecure-Requests": 1
    }
  })
  .then(async res => {
    const $ = cheerio.load(await res.text());
    const link = $('.statuscol.cell.c2.lastcol[colspan="3"]>a');
    // .attribs.href
    if(link.length === 1){
      resolve(link[0].attribs.href);
    } else{
      resolve(false);
    }
  })
  .catch(err => reject(err))  
 });

 const page_absen = (link, cookie) => new Promise((resolve,reject) => {
  fetch(link, {
    method: 'GET',
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:75.0) Gecko/20100101 Firefox/75.0",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      Cookie: cookie,
      "Upgrade-Insecure-Requests": 1
    }
  })
  .then(async res => {
    const $ = cheerio.load(await res.text());
    const sessid = $('input[name="sessid"]').attr('value');
    const sesskey = $('input[name="sesskey"]').attr('value');
    const qf_mod = $('input[name="_qf__mod_attendance_student_attendance_form"]').attr('value');
    const mform = $('input[name="mform_isexpanded_id_session"]').attr('value');
    const status = $('fieldset.felement.fgroup>span>input')[0].attribs.value;
    const submitButton = $('input[name="submitbutton"]').attr('value');

    const result = {
      sessid,sesskey,qf_mod,mform,submitButton,status
    }
    resolve(result);
  })
  .catch(err => reject(err))  
 });

 const absen_action = (data,cookie) => new Promise((resolve,reject) => {
  fetch('http://jti.polije.ac.id/elearning/mod/attendance/attendance.php', {
    method: 'POST',
    headers: {
      Connection: "keep-alive",
      "Content-Length": 89,
      "Cache-Control": "max-age=0",
      Origin: "http://jti.polije.ac.id",
      "Upgrade-Insecure-Requests": 1,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/80.0.3987.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      Referer: "http://jti.polije.ac.id/elearning/login/index.php",
      "Accept-Encoding": "gzip, deflate",
      "Accept-Language": "en-US",
      Cookie: cookie
    },
    body: `sessid=${data.sessid}&sesskey=${data.sesskey}&sesskey=${data.sesskey}&_qf__mod_attendance_student_attendance_form=${data.qfmod}&mform_isexpanded_id_session=${data.mform}&status=${data.status}&submitbutton=Save+changes`
  })
  .then(async res => {
    // const $ = cheerio.load(await res.text());
    // const link = $('table.generaltable.attwidth.boxaligncenter>tbody>tr.lastrow');

    resolve(await res);
  })  
  .catch(err => reject(err))
}); 

const removeDuplicates =  (originalArray, prop) => {
  var newArray = [];
  var lookupObject  = {};

  for(var i in originalArray) {
     lookupObject[originalArray[i][prop]] = originalArray[i];
  }

  for(i in lookupObject) {
      newArray.push(lookupObject[i]);
  }
   return newArray;
}  


(async () => {
  const fileStream = fs.createReadStream(`${__dirname}/nim.txt`);

  const txt = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of txt) {
    if(line === ''){
      continue;
    }
      const nim = line;
      const pass = 'jtipolije';
      const cookie = await getCookieLoginPage();
      const moodleSession = cookie.cookie[0].split(';')[0];
      const token = cookie.token;
      console.log(`[#] ${nim} loginn ..`);
      const logins = await login(nim,pass,moodleSession,token);
  
      if(logins.cookie === undefined){
        console.log(`[#] ${nim} login gagal\n`);
        continue;
      }
      
      const moodleSession2 = logins.cookie[0].split(';')[0];
      const seskey = await pageMy(moodleSession2);
      const link_absen = await eventPage(moodleSession2); 
      console.log(`[#] login sukses ${seskey.nama}`);

      const arr_unique = removeDuplicates(link_absen,"link");

      console.log(`[#] ketemu link absen : ${arr_unique.length}\n${arr_unique.map((ele,ind) => `[#] ${ind+1}. matkul: ${ele.matkul}\n[#] ** waktu : ${ele.waktu}`).join('\n')}`);

      
      const bisa_absen = [];
      
      if(arr_unique.length === 0){
        console.log('\n');
        continue ;
      }
      for(let i = 0; i <= arr_unique.length -1 ; i++){
        const bisa = await cekAbsen(arr_unique[i].link, moodleSession2);
        if(bisa !== false){
          bisa_absen.push(bisa);
        }
      }

      console.log(`[#] link bisa absen : ${bisa_absen.length}`);

      if(bisa_absen.length === 0){
        console.log('\n');
        continue ;
      }

      console.log('[#] sedang mengabsen ...');
      for(let i = 0; i <= bisa_absen.length -1 ; i++){
        const bahan_absen = await page_absen(bisa_absen[i], moodleSession2);
        const data = {
          sessid: bahan_absen.sessid,
          sesskey: bahan_absen.sesskey,
          qfmod: bahan_absen.qf_mod,
          mform: bahan_absen.mform,
          status: bahan_absen.status
        }
  
        const gas_absen = await absen_action(data,moodleSession2);
        if(gas_absen.status == 200){
          console.log(`[#] ${seskey.nama} berhasil Absen`);
        } else {
          console.log(`[#] ${seskey.nama} gagal Absen`);
        }
      }
      console.log('\n');
  }
})();