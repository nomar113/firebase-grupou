const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const admin = require('firebase-admin');

const PermutationRepository = require("../repository/PermutationRepository");
const FormationService = require("../services/FormationService");

class GenerateGroupsService {
  async execute({ classroomNumber, numberOfStudents, numberOfMemberPerGroup }) {
    const formationService = new FormationService();

    const formations = await formationService.execute({
      numberOfStudents, numberOfMemberPerGroup
    });

    let fileName = `permutationsFile-${numberOfStudents}.txt`;

    const permutationRepository = new PermutationRepository();

    const permutations = await permutationRepository.readFile({
      fileName
    });

    const db = admin.firestore();

    const turma = await db.collection("turmas").doc(String(classroomNumber)).get()
      .then((doc) => {
        return doc.data();
      });

    let segregations = [];

    formations.map(formation => {
      permutations.map(permutation => {
        let segregation = [];
        let elementBefore = 0;
        formation.map(number => {
          segregation.push(permutation.slice(elementBefore, elementBefore + number).sort());
          elementBefore += number;
        })
        segregation.sort((a, b) => a[0] - b[0]);
        segregation.sort((a, b) => a.length - b.length);
        segregations.push(segregation);
      });
    });

    let segregationsSet = new Set(segregations.map(JSON.stringify));
    let segregationsUnique = Array.from(segregationsSet).map(JSON.parse);
    segregationsUnique.sort((a, b) => a[0] - b[0]);

    segregationsUnique.map(segregation => {
      segregation.map(groups => {
        groups.map((student, index) => {
          groups[index] = turma.alunos[student]
        })
      })
    })

    const fileNameClassroomPermutation = `classroomPermutations-${classroomNumber}.txt`;
    const bucket = admin.storage().bucket();

    const uuid = uuidv4();

    const file = bucket.file(fileNameClassroomPermutation, {
      metadata: { contentType: 'text/plan', metadata: { firebaseStorageDownloadTokens: uuid } }
    });

    // create local file
    /*
     fs.writeFile(`${fileNameClassroomPermutation}`, JSON.stringify(segregationsUnique), function (err) {
       if (err) return console.log(err);
     });
    */

    file.getMetadata().catch(e => [])
      .then(([m]) => ((m || {}).metadata || {}).firebaseStorageDownloadTokens)
      .then((token = uuidv4()) => file.save(JSON.stringify(segregationsUnique), {
        validation: 'md5',
        resumable: false,
        metadata: {
          contentType: "text/plain",
          metadata: { firebaseStorageDownloadTokens: token }
        }
      }).then(_ => token));

    return segregationsUnique;
  }
}

module.exports = GenerateGroupsService;
