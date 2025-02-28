require('dotenv').config();

const fs = require('fs');
const path = require('path');

const BASE_DIR = process.env.BASE_DIR;
const _YEAR = process.env.YEAR || '2020';
const FILE_DIR = process.env.FILE_DIR;
const FILE_NAME = process.env.FILE_NAME;

const cid10 = require(path.join(BASE_DIR, `/convertedData/cid10.json`));
const cities = require(path.join(BASE_DIR, `/convertedData/cities.json`));

const csvFilePath = path.join(BASE_DIR, FILE_DIR);
const csv = require('csvtojson');
const json2xls = require('json2xls');

csv()
  .fromFile(csvFilePath)
  .then((deaths) => {
    const data = [];
    for (const death of deaths) {
      //normalizing date
      const dataInfo = death['DTOBITO'];
      let day;
      let year = _YEAR;
      let month;

      if (dataInfo.split(year)[0].split('').length === 4) {
        day = dataInfo.split(year)[0].split('')[0] + dataInfo.split(year)[0].split('')[1];
        month = dataInfo.split(year)[0].split('')[2] + dataInfo.split(year)[0].split('')[3];
      } else {
        day = dataInfo.split(year)[0].split('')[0];
        month = dataInfo.split(year)[0].split('')[1] + dataInfo.split(year)[0].split('')[2];
      }

      //normalizing age
      let age = '00'; // nao comeca com 4, nem com 5 (100+anos), morreu antes de ter 1 ano
      const ageInfo = death['IDADE'];
      let age_group = '0-10';
      if (ageInfo.split('')[0] === '4') {
        age = ageInfo.split('')[1] + ageInfo.split('')[2];
        const intAge = Number(age);
        if (intAge <= 10) {
          age_group = '0-10';
        } else if (intAge > 10 && intAge <= 20) {
          age_group = '11-20';
        } else if (intAge > 20 && intAge <= 40) {
          age_group = '21-40';
        } else if (intAge > 40 && intAge <= 60) {
          age_group = '40-60';
        } else if (intAge > 60) {
          age_group = '60<';
        }

      } else if (ageInfo.split('')[0] === '5') {
        age = '1' + ageInfo.split('')[1] + ageInfo.split('')[2];
        age_group = '60<';
      }

      //normalizing sex
      const sexInfo = death['SEXO'];
      let sex = 'Ignorado'
      if (sexInfo === '1') {
        sex = 'M'
      } else if (sexInfo === '2') {
        sex = 'F'
      }

      //normalizing city
      const cityInfo = death['CODMUNOCOR'];
      const cityNormalized = cities.filter(el => el.mun_code === cityInfo);

      let uf_name = '';
      let uf_code = '';
      let city_name = '';
      let city_code = '';

      if (cityNormalized && cityNormalized.length) {
        uf_name = cityNormalized[0].uf_name
        uf_code = cityNormalized[0].uf_code
        city_name = cityNormalized[0].mun_name
        city_code = cityNormalized[0].mun_code
      }

      //normalizing causabas
      const causeInfo = death['CAUSABAS'];
      const causeNormalized = cid10.filter(el => el && el.code_cid === causeInfo);

      let death_cause_code = '';
      let death_cause_desc = '';
      let death_cause_category = '';

      if (causeNormalized && causeNormalized.length) {
        death_cause_code = causeNormalized[0].code_cid
        death_cause_desc = causeNormalized[0].desc_cid
        death_cause_category = causeNormalized[0].cid_category
      }

      //normalizing circumstance
      const circumstanceInfo = death['CIRCOBITO'];
      let circumstance = '';

      if (circumstanceInfo === '9') {
        circumstance = 'Ignorado'
      } else if (circumstanceInfo === '1') {
        circumstance = 'Acidente'
      } else if (circumstanceInfo === '2') {
        circumstance = 'Suicídio'
      } else if (circumstanceInfo === '3') {
        circumstance = 'Homicídio'
      }
      else if (circumstanceInfo === '4') {
        circumstance = 'Outros'
      }

      const workInfo = death['ACIDTRAB'];
      let workAccident = '';

      if (workInfo === '9') {
        workAccident = 'Ignorado'
      } else if (workInfo === '1') {
        workAccident = 'Sim'
      } else if (workInfo === '2') {
        workAccident = 'Não'
      }

      data.push({
        'DIA': day,
        'MES': month,
        'ANO': year,
        'IDADE': age,
        'FAIXA_ETARIA': age_group,
        'SEXO': sex,
        'UF': uf_name,
        'COD_UF': uf_code,
        'MUNICIPIO': city_name,
        'COD_MUNICIPIO': city_code,
        'CAUSABAS': death_cause_code,
        'CAUSABAS_CATEG': death_cause_category,
        'CAUSABAS_DESC': death_cause_desc,
        'CIRCOBITO': circumstance,
        'ACIDTRAB': workAccident
      });

    }


    if (data.length) {
      fs.writeFileSync(path.join(BASE_DIR, `/convertedData/${FILE_NAME}.xlsx`), json2xls(data), 'binary');
    }
  })
