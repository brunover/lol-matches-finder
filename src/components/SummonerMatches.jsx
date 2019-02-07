import React from "react"
import { Row, Col, Badge } from "react-bootstrap"

const SummonerMatches = props => {
  return (
    <div className="matches-wrapper">
      <Row bg={props.matchs.outcome ? "blue" : "red"}>
        <Col md="4">
          <Badge variant={props.matchs.outcome ? "primary" : "danger"}>
            {props.matchs.outcome ? "Victory" : "Defeat"}
          </Badge>
          <p>Duration: {props.matchs.gameDuration}</p>
          <p>K/D/A: {props.matchs.kdaScore}</p>
        </Col>
        <Col md="4">
          <h3>Champion Name: {props.matchs.championName}</h3>
          <p>Spells: {props.matchs.summonerSpells}</p>
          <p>Runes: {props.matchs.summonerRunes}</p>
        </Col>
        <Col md="4">
          <p>Champ Level: {props.matchs.champLevel}</p>
          <p>Items: {props.matchs.items.join(", ")}</p>
          <p>Total Minions Killed: {props.matchs.totalMinionsKilled}</p>
          <p>
            Minions Score Per Minute:{" "}
            {props.matchs.minionsScorePerMinute.toFixed(2)}
          </p>
        </Col>
      </Row>
      <hr />
    </div>
  );
};

export default SummonerMatches
