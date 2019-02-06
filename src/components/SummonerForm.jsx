import React from "react";

const isInvalidSummonerName = (name) => {
    if (name.length === 0) return true
    const nameRegExp = new RegExp('^[a-zA-Z0-9\\p{L} _\\.]+$')
    let nameMatched = nameRegExp.test(name)
    if (!nameMatched) return true
    return false
}

class SummonerForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {suname: ''};

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({suname: event.target.value});
    }

    handleSubmit(event) {
        event.preventDefault();
        let summonerName = this.state.suname
        if (isInvalidSummonerName(summonerName)) {
            alert('Please inform a valid Summoner name!')
            return
        }
    }

    render() {
        return (
            <div className="Summoner-finder-form">
                <p>League Stats:</p>
                <form onSubmit={this.handleSubmit}>
                    <input type="text" name="name" placeholder="Enter Summoner Name" value={this.state.suname} onChange={this.handleChange} />
                    <input type="submit" value="Find Matches" />
                </form>
            </div>
        );
    }
}

export default SummonerForm;
