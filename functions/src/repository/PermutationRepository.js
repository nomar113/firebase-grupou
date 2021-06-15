const admin = require('firebase-admin');

const serviceAccount = require('../auth/serviceAccountKey.json');

class PermutationRepository {
  async readFile({ fileName }) {
    console.log(fileName)
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: 'grupou-cloud-functions.appspot.com'
    });

    const bucket = admin.storage().bucket();

    // create stream of the file in bucket
    const stream = bucket.file(`${fileName}`).createReadStream();

    function streamToString(stream) {
      const chunks = [];
      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', (err) => reject(err));
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      })
    }

    // format file content
    const permutation = await streamToString(stream)

    const readFile = permutation.split('\n');

    const formattedReadFile = readFile.filter(item => {
      return item !== ""
    })

    const permutations = formattedReadFile.map(item => {
      return JSON.parse(item)
    })

    return permutations;
  }
}

module.exports = PermutationRepository;
