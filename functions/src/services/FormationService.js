class FormationService {
  async execute({ numberOfStudents, numberOfMemberPerGroup }) {
    const groupVariableQuantity = 2;

    const numberOfMaxGroups = Math.ceil(numberOfStudents / numberOfMemberPerGroup);
    const restOfDivision = numberOfStudents % numberOfMemberPerGroup;
    const numberOfGroupsWithExactQuantityOfMembers = numberOfMaxGroups - groupVariableQuantity;

    let combinationsOfNumbersOfMembersPerGroup = [];

    if (restOfDivision === 0) {
      const formation = Array.from(
        { length: numberOfMaxGroups },
        () => numberOfMemberPerGroup
      );
      combinationsOfNumbersOfMembersPerGroup.push(formation);
    } else {
      for (let j = numberOfMemberPerGroup, k = restOfDivision; j >= k; j--, k++) {
        const formation = Array.from(
          { length: numberOfGroupsWithExactQuantityOfMembers },
          () => numberOfMemberPerGroup
        );
        formation.push(j);
        formation.push(k);
        combinationsOfNumbersOfMembersPerGroup.push(formation);
      }
    }
    console.log(combinationsOfNumbersOfMembersPerGroup);
    return combinationsOfNumbersOfMembersPerGroup
  }
}

module.exports = FormationService;
