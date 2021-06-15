// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require("firebase-functions");
// The Firebase Admin SDK to access Firestore. >>Use  admin.initializeApp();
const admin = require('firebase-admin');
const Chance = require('chance');

const serviceAccount = require('./src/auth/serviceAccountKey.json');

const permutationsApi = require("./src/routes/permutations.routes");
const formationsApi = require("./src/routes/formation.routes");
const generateGroupsApi = require("./src/routes/groups.routes");


// Take the text parameter passed to this HTTP endpoint and insert it into
// TODO: 1 - FUNCTION PARA GERAR O MOCK DE TURMAS 
exports.mock = functions.https.onRequest((request, response) => {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  const db = admin.firestore();
  const chance = new Chance();

  let numero_turma = request.body.numero_turma;
  let quantidade_alunos = request.body.quantidade_alunos;

  const params = require('./config/parametros.js')(numero_turma, quantidade_alunos);

  const { turma, hardskills_atividade } = params;

  require('./libs/ClassroomGenerate.js')(chance)

  const { alunos, analise_hardskills_turma } = chance.classroom(params);

  db.collection('turmas')
    .doc(String(turma))
    .set({
      alunos,
      analise: analise_hardskills_turma,
      hardskills_atividade
    }, { merge: true }).then(function (doc) {
      response.json("Mock da Turma gerado com sucesso!");
    });

});

// TODO: 2 - FUNCTIONS PARA GERAR OS MELHORES CASOS
exports.permutations = functions.https.onRequest(permutationsApi);
exports.formations = functions.https.onRequest(formationsApi);
exports.generateGroups = functions.https.onRequest(generateGroupsApi);

// TODO: 3 - FUNCTION PARA GERAR O ANALYZER DOS GRUPOS
exports.analyzer = functions.https.onRequest(async (request, response) => {
  let numero_turma = request.body.numero_turma;

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'grupou-cloud-functions.appspot.com'
  });

  const bucket = admin.storage().bucket();

  const fileName = `classroomPermutations-${numero_turma}.txt`;

  const stream = bucket.file(`${fileName}`).createReadStream();

  function streamToString(stream) {
    const chunks = [];
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('error', (err) => reject(err));
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    })
  }

  const classroomPermutations = JSON.parse(await streamToString(stream));

  const grupos = {};

  classroomPermutations.map((permutations, indexPermutation) => {
    permutations.map((group, index) => {
      grupos[`grupo_${index + 1}`] = [];
      group.map(student => {
        console.log(student);
        grupos[`grupo_${index + 1}`].push(student);


        let min_deficit_distribuicao = 100;
        let max_deficit_distribuicao = 0;

        let min_softskill = 100;
        let max_softskill = 0;

        for (let g in grupos.grupos) {

          let grupo = grupos.grupos[g]
          // console.log(g, grupo)


          let total_integrantes = grupo.length;
          let softskills = [];
          let conhecimento_grupo = {
            hardskills: {},
            total_conhecimento_hardskills: 0,
          }

          for (let a in grupo) {
            let aluno = grupo[a];

            for (let s in aluno.softskills) {
              let softskill = aluno.softskills[s];
              if (!softskills.includes(softskill)) {

                softskills.push(softskill);
              }
            }

            for (let h in aluno.hardskills) {
              let hardskill = aluno.hardskills[h];

              conhecimento_grupo.total_conhecimento_hardskills += hardskill.nota;
              if (!conhecimento_grupo.hardskills.hasOwnProperty(h)) {
                conhecimento_grupo.hardskills[h] = {
                  total_pontos: hardskill.nota
                }
              } else {
                conhecimento_grupo.hardskills[h].total_pontos += hardskill.nota
              }

            }

          }
          let deficit_distribuicao = 0;

          for (let h in conhecimento_grupo.hardskills) {
            let hardskill = conhecimento_grupo.hardskills[h]

            conhecimento_grupo.hardskills[h].percentual = (hardskill.total_pontos * 100) / conhecimento_grupo.total_conhecimento_hardskills

            // console.log(grupos.hardskills_atividade)

            if (conhecimento_grupo.hardskills[h].percentual < grupos.hardskills_atividade[h].peso) {
              let deficit = grupos.hardskills_atividade[h].peso - conhecimento_grupo.hardskills[h].percentual;
              deficit_distribuicao += deficit;
              // console.log(g, h, conhecimento_grupo.hardskills[h].percentual, grupos.hardskills_atividade[h].peso, deficit)
            } else {
              // console.log(g, h, conhecimento_grupo.hardskills[h].percentual, grupos.hardskills_atividade[h].peso)
            }



          }

          if (deficit_distribuicao < min_deficit_distribuicao) {
            min_deficit_distribuicao = deficit_distribuicao
          }

          if (deficit_distribuicao > max_deficit_distribuicao) {
            max_deficit_distribuicao = deficit_distribuicao
          }


          conhecimento_grupo['deficit_hardskills_absoluto'] = deficit_distribuicao;
          console.log(g, conhecimento_grupo['deficit_hardskills_absoluto'])

          // console.log(g, softskills.length / total_integrantes);

          conhecimento_grupo['media_softskills'] = softskills.length / total_integrantes

          if (conhecimento_grupo['media_softskills'] < min_softskill) {
            min_softskill = conhecimento_grupo['media_softskills']
          }

          if (conhecimento_grupo['media_softskills'] > max_softskill) {
            max_softskill = conhecimento_grupo['media_softskills']
          }


          grupos.grupos[g] = {
            conhecimento_grupo
          }

        }
        console.log(min_deficit_distribuicao, max_deficit_distribuicao)
        console.log(min_softskill, max_softskill)


        let gap_softskill = 0;
        for (let cg in grupos.grupos) {
          let grupo = grupos.grupos[cg].conhecimento_grupo
          console.log(grupo.media_softskills)
          let gap = (max_softskill - grupo.media_softskills) /
            (max_softskill - min_softskill)
          console.log("gap_softskill", gap)


          if (gap > 0 && gap < 1) {
            gap_softskill += gap
          }

        }


        let gap_hardskill = 0;
        for (let cg in grupos.grupos) {
          let grupo = grupos.grupos[cg].conhecimento_grupo
          console.log("grupo.deficit_hardskills_absoluto: ", grupo.deficit_hardskills_absoluto)
          console.log((min_deficit_distribuicao - grupo.deficit_hardskills_absoluto) + "/" + (min_deficit_distribuicao - max_deficit_distribuicao))
          let gap = (min_deficit_distribuicao - grupo.deficit_hardskills_absoluto) /
            (min_deficit_distribuicao - max_deficit_distribuicao)
          console.log("gap", gap)

          grupos.grupos[cg].conhecimento_grupo['deficit_hardskills_relativo'] = grupo.deficit_hardskills_absoluto * gap
          if (gap > 0 && gap < 1) {
            gap_hardskill += gap
          }

        }

        let analise = {
          grupos: grupos,
          gap_hardskill: gap_hardskill,
          gap_softskill: gap_softskill,
          acuracia: 100 - (9 * gap_hardskill) + (1 * gap_softskill)
        }

        const db = admin.firestore();

        db.collection('turmas').doc(String(numero_turma))
          .collection('analise').doc(String(indexPermutation) + '_analise').set({
            analise
          });

      })
    })
  });

  response.json("Análise finalizada com sucesso!");

});

//1 - RODAR FUNCTION PARA GERAR MOCK DE TURMAS 
exports.mock = functions.https.onRequest((request, response) => {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  const db = admin.firestore();
  const chance = new Chance();

  let numero_turma = request.body.numero_turma;
  let quantidade_alunos = request.body.quantidade_alunos;

  const params = require('./config/parametros.js')(numero_turma, quantidade_alunos);

  const { turma, hardskills_atividade } = params;

  require('./libs/ClassroomGenerate.js')(chance)

  const { alunos, analise_hardskills_turma } = chance.classroom(params);

  db.collection('turmas').doc(String(turma)).set({
    alunos,
    analise: analise_hardskills_turma,
    hardskills_atividade
  }, { merge: true }).then(function (doc) {
    response.json("Mock da Turma gerado com sucesso!");
  });

});
