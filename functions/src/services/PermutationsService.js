const admin = require('firebase-admin');
const path = require('path');
const os = require('os');
const fs = require('fs');

class PermutationsService {
  async execute({ number }) {
    admin.initializeApp();
    const v = Array.from(
      { length: number },
      (v, k) => k
    );

    console.log(v.length)

    function troca(i, j) {
      let aux = v[i];
      v[i] = v[j];
      v[j] = aux;
    }

    console.log(await permute(0, v.length - 1));

    const permutationFileName = `permutationsFile-${number}.txt`
    fs.writeFileSync(permutationFileName, "");
    var permutations = [];

    async function permute(inf, sup) {
      try {
        let permutation = [];
        if (inf === sup) {
          for (let index = 0; index <= sup; index++) {
            permutation.push(v[index]);
          }
          fs.writeFileSync(permutationFileName, `${JSON.stringify(permutation)}\n`, { flag: 'a+' });
          // await db.collection("permutations").doc(String(number)).set(permutation);
        } else {
          for (let index = inf; index <= sup; index++) {
            troca(inf, index);
            permute(inf + 1, sup);
            troca(inf, index);
          }
        }
        permutations = fs.readFileSync(permutationFileName).toString().split("\n");
      } catch (error) {
        console.error(error)
      }

    }
    return permutations;
  }
}

module.exports = PermutationsService;
