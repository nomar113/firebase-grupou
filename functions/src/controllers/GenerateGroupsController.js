const GenerateGroupsService = require("../services/GenerateGroupsService")

class GenerateGroupsController {
  async create(req, res) {

    const { classroomNumber, numberOfStudents, numberOfMemberPerGroup } = req.body;

    const generateGroupsService = new GenerateGroupsService();

    const generatedGroups = await generateGroupsService.execute({
      classroomNumber, numberOfStudents, numberOfMemberPerGroup
    });

    res.send(generatedGroups);
  }
}

module.exports = GenerateGroupsController;