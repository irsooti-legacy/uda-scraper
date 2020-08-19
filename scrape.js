const fs = require('fs');
const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');
const utils = require('./utils');

/**
 * Esami
 */
const scrapeExams = (document) => {
  const exam = {};

  document.querySelectorAll('#esami a[href^="https://teams"]').forEach((f) => {
    const [title, ...rest] = f.textContent
      .split('-')
      .map((m) => m.trim().toLowerCase());
    console.log();
    exam[rest.slice(-1)] = {
      description: f.textContent
        .replace(`- ${rest.slice(-1)}`, '')
        .trim()
        .toLowerCase(),
      teamsChannel: f.getAttribute('href'),
    };

    console.log(exam[rest.slice(-1)]);
  });

  const pds = require('./out/percorsi-di-studio.json');

  pds.map((p) => {
    document
      .querySelectorAll(
        `#esami #i${p.cds_id.toUpperCase()}body .card-body>div[id^='e${p.cds_id.toUpperCase()}']`
      )
      .forEach((f) => {
        const rest = f.textContent
          .split('-')
          .map((m) => m.trim().toLowerCase())
          .slice(-1);

        exam[rest].pathOfStudySlug = p.slug;
      });
  });

  const cds = require('./out/corsi-di-studio.json');

  cds.map((p) => {
    console.log(`#esami div[id*="${p.code}"] a[href^="https://teams"]`);
    document
      .querySelectorAll(
        `div[id*="${p.code.toUpperCase()}content"] a[href^="https://teams"]`
      )
      .forEach((f) => {
        const rest = f.textContent
          .split('-')
          .map((m) => m.trim().toLowerCase());

        console.log(rest.slice(-1));
        exam[rest.slice(-1)[0]]
          ? (exam[rest.slice(-1)[0]].courseOfStudyCode = p.code)
          : (exam[rest.slice(-1)[0]] = { courseOfStudyCode: p.code });
      });
  });

  return exam;
};

/**
 * Corsi di studio
 */

const scrapeCorsiDiStudio = (document) => {
  const cds = [];
  document
    .querySelectorAll('#esami >div>div> div>.card-header')
    .forEach((f) => {
      const [code, title] = f.textContent
        .split('-')
        .map((m) => m.trim().toLowerCase());

      cds.push({
        code,
        description: title,
        slug: utils.dashify(title),
      });
    });

  return cds;
};

/**
 * Percorsi di studio
 */

const scrapePercorsiDiStudio = (document) => {
  const cds = scrapeCorsiDiStudio(document);
  const pds = [];

  cds.map((c) => {
    document
      .querySelectorAll(`#i${c.code}body .card-body>div[id^='e${c.code}']`)
      .forEach((f) => {
        const [code, title] = f.textContent
          .split('-')
          .map((m) => m.trim().toLowerCase());

        pds.push({
          cds_id: c.code,
          description: title.replace(/\r?\n|\r/g, ''),
          slug: utils.dashify(title),
        });
      });
  });

  return pds;
};

/**
 *
 * @param {*} selector
 * @param {*} document
 * @param {*} arrayToMutate
 */

/**
 * Lezioni on-line
 */
const scraperType1 = (selector, document, arrayToMutate) => {
  document.querySelectorAll(selector).forEach((e) => {
    const [name] = e.textContent.match(/[^[\]]+(?=])/g);
    const title = e.textContent.split(']')[1].trim().toLowerCase();
    arrayToMutate.push({
      link: e.getAttribute('href'),
      code: name.split(' ')[0].toUpperCase(),
      slug: name.split(' ')[1].toLowerCase(),
      title,
    });
  });
};

const scraperType2 = (selector, document, slug, arrayToMutate) => {
  document.querySelectorAll(selector).forEach((e) => {
    const [code, title] = e.textContent
      .split('-')
      .map((m) => m.trim().toLowerCase());
    arrayToMutate.push({
      link: e.getAttribute('href'),
      code: code.toUpperCase(),
      slug,
      title,
    });
  });
};

const scraperType3 = (selector, document, slug, arrayToMutate) => {
  document.querySelectorAll(selector).forEach((e) => {
    const [title, code] = e.textContent
      .split('-')
      .map((m) => m.trim().toLowerCase());
    arrayToMutate.push({
      link: e.getAttribute('href'),
      code: code.toUpperCase(),
      slug,
      title,
    });
  });
};

const scrape = async () => {
  const html = await fetch('https://zeus.unich.it/teledidattica').then((r) =>
    r.text()
  );

  const {
    window: { document },
  } = new JSDOM(html);
  const items = scrapeExams(document);

  // scraperType1('#scuolecontent a', document, items);
  // scraperType2('#dipcontent a', document, 'dipartimenti', items);
  // scraperType2('#cdscontent a', document, 'corso-di-studio', items);
  // scraperType2('#dottcontent a', document, 'dottorati', items);
  // scraperType3('#d700Mcontent a', document, 'architettura', items);
  // scraperType3('#dL648body a', document, 'assistenza-sanitaria', items);
  // scraperType3('#dBASAcontent a', document, 'basa', items);
  // scraperType3('#dOBC7body a', document, 'beni-culturali', items);

  fs.writeFile(
    'myjsonfile.json',
    JSON.stringify(items, null, 4),
    'utf8',
    (err) => {
      console.log(err);
    }
  );
};

scrape();
