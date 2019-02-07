import React from "react";
import axios from 'axios';

/**
 * Checks if the summoner name is invalid
 * @param {String} name 
 * @return {Boolean} true if it is invalid, false otherwise
 */
const isInvalidSummonerName = (name) => {
    if (name.length === 0) return true
    const nameRegExp = new RegExp('^[a-zA-Z0-9\\p{L} _\\.]+$')
    let nameMatched = nameRegExp.test(name)
    if (!nameMatched) return true
    return false
}

/**
 * Show loading prompt while awaits the fetch resolve
 */
const showLoadingPrompt = (thisBind) => {
    document.querySelector('#submitBtnID').disabled = true
    thisBind.setState({matchesTable: '...Loading'})
}

/**
 * Hides loading prompt after fetch resolve
 * @param {String} msg Optional msg to display after hiding loading
 */
const hideLoadingPrompt = (thisBind, msg = '') => {
    document.querySelector('#submitBtnID').disabled = false
    thisBind.setState({matchesTable: msg})
}

class SummonerForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            summonerName: '',
            matchesTable: ''
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({summonerName: event.target.value});
    }

    handleSubmit(event) {
        event.preventDefault()
        showLoadingPrompt(this)

        const summonerName = this.state.summonerName
        if (isInvalidSummonerName(summonerName)) {
            hideLoadingPrompt('Please inform a valid Summoner name!')
            return
        }
        
        // Fetches summoner data
        const summonerByNameAPI = `${process.env.REACT_APP_API_V4_SUMMONER_BY_NAME}/${summonerName}?api_key=${process.env.REACT_APP_RIOT_API_KEY}`;
        axios.get(process.env.REACT_APP_PROXY_URL + summonerByNameAPI)
            .then(summoner => {
                hideLoadingPrompt(this)

                // Retrieve accountId from summoner data
                const accountId = summoner.data.accountId

                // Fetchs matchlist
                const matchlistByAccountAPI = `${process.env.REACT_APP_API_V4_MATCHLIST_BY_ACCOUNT}/${accountId}?endIndex=10&api_key=${process.env.REACT_APP_RIOT_API_KEY}`;
                axios.get(process.env.REACT_APP_PROXY_URL + matchlistByAccountAPI)
                    .then(matchlist => {
                        const matches = matchlist.data.matches
                        
                        // Checks if matchlist contains matches
                        if (matches.length === 0) {
                            hideLoadingPrompt(this, 'This Summoner has not played matches yet')
                            return
                        }

                        let matchesTable = []
                        for (let match of matches) {
                            // Retrieve gameId from the match to fetch details
                            const gameId = match.gameId
                            
                            // Fetchs the game details0
                            const matchByIdAPI = `${process.env.REACT_APP_API_V4_MATCH_BY_ID}/${gameId}?api_key=${process.env.REACT_APP_RIOT_API_KEY}`;
                            
                            axios.get(process.env.REACT_APP_PROXY_URL + matchByIdAPI)
                                .then(matchDetails => {
                                    console.log(matchDetails)
                                    const participantIdentities = matchDetails.data.participantIdentities
                                    const summonerParticipantIdenty = participantIdentities.find(par => par.player.summonerName.toLowerCase() === summonerName.toLowerCase())
                                    
                                    const participants = matchDetails.data.participants
                                    const summonerParticipantDetails = participants.find(par => par.participantId === summonerParticipantIdenty.participantId)
                                    const outcome = summonerParticipantDetails.stats.win
                                    
                                    const gameDurationFloat = matchDetails.data.gameDuration === 0 ? 0 : (matchDetails.data.gameDuration) / 60
                                    const gameDurationMinutes = Math.floor(gameDurationFloat)
                                    const gameDurationSeconds = (gameDurationFloat.toFixed(2)+"").split(".")[1]

                                    const spellOne = summonerParticipantDetails.spell1Id
                                    const spellTwo = summonerParticipantDetails.spell2Id

                                    const summonerRunePrimary = summonerParticipantDetails.stats.perkPrimaryStyle
                                    const summonerRuneSecondary = summonerParticipantDetails.stats.perkSubStyle

                                    const championName = summonerParticipantDetails.championId
                                    
                                    const kills = summonerParticipantDetails.stats.kills
                                    const deaths = summonerParticipantDetails.stats.deaths
                                    const assists = summonerParticipantDetails.stats.assists

                                    const items = [ summonerParticipantDetails.stats.item0, summonerParticipantDetails.stats.item1, summonerParticipantDetails.stats.item2, summonerParticipantDetails.stats.item3, summonerParticipantDetails.stats.item4, summonerParticipantDetails.stats.item5, summonerParticipantDetails.stats.item6 ]

                                    const champLevel = summonerParticipantDetails.stats.champLevel
                                    
                                    const totalMinionsKilled = summonerParticipantDetails.stats.totalMinionsKilled
                                    const minionsScorePerMinute = totalMinionsKilled === 0 ? 0 : (totalMinionsKilled / gameDurationMinutes)

                                    matchesTable.push({
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
                                        minionsScorePerMinute,
                                    })
                                })
                        }
                    })                
            })
            .catch(error => { 
                hideLoadingPrompt(this, 'An error occurred while trying to retrieve your matches. Please try again later...')
                console.error(error)
            })
    }

    render() {
        return (
            <div className="Summoner-finder-form">
                <p>League Stats:</p>
                <form onSubmit={this.handleSubmit}>
                    <input type="text" name="name" placeholder="Enter Summoner Name" value={this.state.summonerName} onChange={this.handleChange} />
                    <input id="submitBtnID" type="submit" value="Find Matches" />
                </form>

                <div id="matchesTableID" className="Summoner-matches">
                    {this.state.matchesTable}
                </div>
            </div>
        );
    }
}

export default SummonerForm;
