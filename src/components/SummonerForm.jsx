import React from "react";

const axios = require('axios');

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
 */
const hideLoadingPrompt = () => {
    document.querySelector('#submitBtnID').disabled = false
    document.querySelector('#matchesTableID').innerHTML = ''
}

class SummonerForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {summonerName: ''};

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
            alert('Please inform a valid Summoner name!')
            hideLoadingPrompt()
            return
        }
        
        // Fetches summoner data
        axios.get(`https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summonerName}?api_key=${process.env.REACT_APP_RIOT_API_KEY}`, {
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        })
            .then(response => {
                return response.json()
            })
            .then(summoner => {
                const hashedName = summonerName.toLowerCase().replace(/ /g, '')
            
                // find the data for target summoner
                const summonerData = summoner[hashedName]
            
                // do something else
                console.log(summonerData)
                hideLoadingPrompt()
            })
            .catch(error => { 
                console.error(error)
                hideLoadingPrompt()
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
