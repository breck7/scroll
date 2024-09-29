class EloAnythingApp {
  constructor(objectsToRateArray) {
    this.objects = objectsToRateArray.map(obj => ({
      ...obj,
      elo: 1500, // Starting ELO score
      gamesPlayed: 0
    }))
  }

  get rankings() {
    return [...this.objects].sort((a, b) => b.elo - a.elo)
  }

  get nextGame() {
    // Find two objects with the least number of games played
    const sortedByGames = [...this.objects].sort((a, b) => a.gamesPlayed - b.gamesPlayed)
    return [sortedByGames[0], sortedByGames[1]]
  }

  addResult(winningId, losingId) {
    const winner = this.objects.find(obj => obj.id === winningId)
    const loser = this.objects.find(obj => obj.id === losingId)
    const kFactor = 32
    const expectedScoreWinner = 1 / (1 + Math.pow(10, (loser.elo - winner.elo) / 400))
    const expectedScoreLoser = 1 - expectedScoreWinner

    winner.elo += kFactor * (1 - expectedScoreWinner)
    loser.elo += kFactor * (0 - expectedScoreLoser)

    winner.gamesPlayed++
    loser.gamesPlayed++
  }

  // Additional helper method to get object by ID
  getObjectById(id) {
    return this.objects.find(obj => obj.id === id)
  }
}
