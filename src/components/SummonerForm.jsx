import React from "react"
import axios from "axios"
import Button from "react-bootstrap/Button"
import InputGroup from "react-bootstrap/InputGroup"
import FormControl from "react-bootstrap/FormControl"
import SummonerMatches from "./SummonerMatches"

/**
 * Checks if the summoner name is invalid
 * @param {String} name
 * @return {Boolean} true if it is invalid, false otherwise
 */
const isInvalidSummonerName = name => {
  if (name.length === 0) return true
  const nameRegExp = new RegExp("^[a-zA-Z0-9\\p{L} _\\.]+$")
  let nameMatched = nameRegExp.test(name)
  if (!nameMatched) return true
  return false
};

/**
 * Show loading prompt while awaits the fetch resolve
 */
const showLoadingPrompt = () => {
  document.querySelector("#submitBtnID").disabled = true
  document.querySelector("#messagePromptID").innerHTML = "...Loading"
};

/**
 * Hides loading prompt after fetch resolve
 * @param {String} msg Optional msg to display after hiding loading
 */
const hideLoadingPrompt = (msg = "") => {
  document.querySelector("#submitBtnID").disabled = false
  document.querySelector("#messagePromptID").innerHTML = msg
};

/**
 * Handle errors while fetching data
 * @param {Error} error 
 */
const handleFetchError = (error) => {
    if (error.response.status === 403) {
        hideLoadingPrompt("The Riot API Key was rejected, please update the API Key...")
    } else if (error.response.status === 404) {
        hideLoadingPrompt("This Summoner name could not be found...")
    } else if (error.response.status === 429) {
      hideLoadingPrompt("Too many requests. Please try again later...")
    } else {
        hideLoadingPrompt("An error occurred while trying to retrieve your matches. Please try again later...")
    }
    throw new Error(error)
}

/**
 * Fetches the summoner details
 * @param {String} summonerName 
 */
const fetchSummoner = async (summonerName) => {
    let accountId = ''

    const summonerByNameAPI = `${process.env.REACT_APP_API_V4_SUMMONER_BY_NAME}/${summonerName}?api_key=${process.env.REACT_APP_RIOT_API_KEY}`;
    await axios.get(process.env.REACT_APP_PROXY_URL + summonerByNameAPI)
        .then(summoner => {
            accountId = summoner.data.accountId
        })
        .catch(error => {
            handleFetchError(error)
        })

    return accountId
}


/**
 * Fetches matchlist
 * @param {Integer} accountId 
 */
const fetchMatchList = async (accountId) => {
    let matches = []

    const matchlistByAccountAPI = `${process.env.REACT_APP_API_V4_MATCHLIST_BY_ACCOUNT}/${accountId}?endIndex=10&api_key=${process.env.REACT_APP_RIOT_API_KEY}`;
    await axios.get(process.env.REACT_APP_PROXY_URL + matchlistByAccountAPI)
        .then(matchlist => {
            matches = matchlist.data.matches;

            // Checks if matchlist contains matches
            if (matches.length === 0) {
                hideLoadingPrompt("This Summoner has not played matches yet");
                return;
            }
        })
        .catch(error => {
            handleFetchError(error)
        })

    return matches
}

/**
 * Fetches match details
 * @param {Array} matches 
 */
const fetchMatchDetails = async (matches, summonerName) => {
    let matchesDetails = []

    for (let match of matches) {
        // Retrieve gameId from the match to fetch details
        const gameId = match.gameId       

        // Fetchs the game details0
        const matchByIdAPI = `${process.env.REACT_APP_API_V4_MATCH_BY_ID}/${gameId}?api_key=${process.env.REACT_APP_RIOT_API_KEY}`
        await axios.get(process.env.REACT_APP_PROXY_URL + matchByIdAPI)
            .then(matchDetails => {
                const participantIdentities = matchDetails.data.participantIdentities
                const summonerParticipantIdenty = participantIdentities.find(par => par.player.summonerName.toLowerCase() === summonerName.toLowerCase())

                const participants = matchDetails.data.participants
                const summonerParticipantDetails = participants.find(par => par.participantId === summonerParticipantIdenty.participantId)
                const outcome = summonerParticipantDetails.stats.win

                const gameDurationFloat = matchDetails.data.gameDuration === 0 ? 0 : matchDetails.data.gameDuration / 60
                const gameDurationMinutes = Math.floor(gameDurationFloat)
                const gameDurationSeconds = (gameDurationFloat.toFixed(2) + "").split(".")[1]

                const spellOne = summonerParticipantDetails.spell1Id
                const spellTwo = summonerParticipantDetails.spell2Id

                const summonerRunePrimary = summonerParticipantDetails.stats.perkPrimaryStyle
                const summonerRuneSecondary = summonerParticipantDetails.stats.perkSubStyle

                const championName = summonerParticipantDetails.championId

                const kills = summonerParticipantDetails.stats.kills
                const deaths = summonerParticipantDetails.stats.deaths
                const assists = summonerParticipantDetails.stats.assists

                const items = [
                    summonerParticipantDetails.stats.item0,
                    summonerParticipantDetails.stats.item1,
                    summonerParticipantDetails.stats.item2,
                    summonerParticipantDetails.stats.item3,
                    summonerParticipantDetails.stats.item4,
                    summonerParticipantDetails.stats.item5,
                    summonerParticipantDetails.stats.item6
                ];

                const champLevel = summonerParticipantDetails.stats.champLevel

                const totalMinionsKilled = summonerParticipantDetails.stats.totalMinionsKilled
                const minionsScorePerMinute = totalMinionsKilled === 0 ? 0 : totalMinionsKilled / gameDurationMinutes

                matchesDetails.push({
                    gameId,
                    summonerName,
                    outcome,
                    gameDuration: `${gameDurationMinutes}m ${gameDurationSeconds}s`,
                    summonerSpells: `${spellOne} | ${spellTwo}`,
                    summonerRunes: `${summonerRunePrimary} | ${summonerRuneSecondary}`,
                    championName,
                    kdaScore: `${kills} / ${deaths} / ${assists}`,
                    items,
                    champLevel,
                    totalMinionsKilled,
                    minionsScorePerMinute
                })
        })
    }

    return matchesDetails;
}

class SummonerForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      summonerName: "",
      matchesDetails: []
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({ summonerName: event.target.value });
  }

  async handleSubmit(event) {
    event.preventDefault();
    showLoadingPrompt();

    this.setState({ matchesDetails: [] });

    const summonerName = this.state.summonerName;
    if (isInvalidSummonerName(summonerName)) {
      hideLoadingPrompt("Please inform a valid Summoner name!");
      return;
    }

    try {
        // Retrieve accountId from summoner data
        const accountId = await fetchSummoner(summonerName)
        
        // Retrieve matches from the accountId
        const matches = await fetchMatchList(accountId)

        // Retrieve details for every match found
        const matchesDetails = await fetchMatchDetails(matches, summonerName)
        
        hideLoadingPrompt();
        this.setState({ matchesDetails });
    } catch (error) {
        return
    }
  }

  render() {
    const { summonerName, matchesDetails } = this.state;

    return (
      <div className="Summoner-finder-form">
        <h2>League Stats:</h2>

        <form onSubmit={this.handleSubmit}>
          <InputGroup
            className="mb-3"
            value={summonerName}
            onChange={this.handleChange}
          >
            <FormControl
              placeholder="Enter Summoner Name"
              aria-label="Enter Summoner Name"
              aria-describedby="basic-addon2"
            />
            <InputGroup.Append>
              <Button variant="info" id="submitBtnID" type="submit">
                Find Matches
              </Button>
            </InputGroup.Append>
          </InputGroup>
        </form>

        <div id="messagePromptID" />

        <div id="matchesDetailsID" className="Summoner-matches">
          {matchesDetails &&
            matchesDetails.map(match => <SummonerMatches key={match.gameId} matchs={match} />)}
        </div>
      </div>
    );
  }
}

export default SummonerForm;
