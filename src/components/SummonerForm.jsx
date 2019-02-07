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
const showLoadingPrompt = () => {
    document.querySelector('#submitBtnID').disabled = true
    document.querySelector('#matchesTableID').innerHTML = '...Loading'
}

/**
 * Hides loading prompt after fetch resolve
 * @param {String} msg Optional msg to display after hiding loading
 */
const hideLoadingPrompt = (msg = '') => {
    document.querySelector('#submitBtnID').disabled = false
    document.querySelector('#matchesTableID').innerHTML = msg
}

class SummonerForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            summonerName: '',
            summonerMatches: []
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({summonerName: event.target.value});
    }

    handleSubmit(event) {
        event.preventDefault()
        showLoadingPrompt()

        let summonerName = this.state.summonerName
        if (isInvalidSummonerName(summonerName)) {
            hideLoadingPrompt('Please inform a valid Summoner name!')
            return
        }
        
        // Fetches summoner data
        const summonerByNameAPI = `${process.env.REACT_APP_API_V4_SUMMONER_BY_NAME}/${summonerName}?api_key=${process.env.REACT_APP_RIOT_API_KEY}`;
        axios.get(process.env.REACT_APP_PROXY_URL + summonerByNameAPI)
            .then(summoner => {
                hideLoadingPrompt()

                // Retrieve accountId from summoner data
                const accountId = summoner.data.accountId

                // Fetchs matchlist
                const matchlistByAccountAPI = `${process.env.REACT_APP_API_V4_MATCHLIST_BY_ACCOUNT}/${accountId}?endIndex=10&api_key=${process.env.REACT_APP_RIOT_API_KEY}`;
                axios.get(process.env.REACT_APP_PROXY_URL + matchlistByAccountAPI)
                    .then(matchlist => {
                        const matches = matchlist.data.matches
                        
                        // Checks if matchlist contains matches
                        if (matches.length === 0) {
                            hideLoadingPrompt('This user has not played matches yet')
                            return
                        }

                        for (let match of matches) {
                            // Retrieve gameId from the match to fetch details
                            const gameId = match.gameId
                            
                            // Fetchs the game details
                            const matchByIdAPI = `${process.env.REACT_APP_API_V4_MATCH_BY_ID}/${gameId}?api_key=${process.env.REACT_APP_RIOT_API_KEY}`;
                            axios.get(process.env.REACT_APP_PROXY_URL + matchByIdAPI)
                                .then(matchDetails => {
                                    
                                })
                        }
                    })                
            })
            .catch(error => { 
                hideLoadingPrompt('An error occurred while trying to retrieve your matches. Please try again later...')
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

                <div id="matchesTableID" className="Summoner-matches"></div>
            </div>
        );
    }
}

export default SummonerForm;
