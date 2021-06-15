const PermutationService = require("../services/PermutationsService")

class PermutationsController {
  async create(req, res) {

    const { number } = req.body;

    console.log(number);

    const permutationService = new PermutationService();

    const permutations = await permutationService.execute({ number });

    res.send(permutations)
  }
}

module.exports = PermutationsController;