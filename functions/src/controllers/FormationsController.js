const FormationService = require("../services/FormationService")

class FormationController {
  async create(req, res) {

    const { numberOfStudents, numberOfMemberPerGroup } = req.body;

    const formationService = new FormationService();

    const formations = await formationService.execute({ numberOfStudents, numberOfMemberPerGroup });

    res.send(formations)
  }
}

module.exports = FormationController;