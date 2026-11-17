# Answer each flag in 20 seconds

**User story:** As a player I want a countdown on each question, so that the game is more exciting.

**Traceability:** RND-05, FLAG-A

### Acceptance criteria

```gherkin
Scenario: Countdown
  Given I am playing "Bandera → País" in "Europa · Fácil"
  Then I see a countdown that starts at 20 seconds

Scenario: Time is up
  When the countdown reaches 0 before I answer
  Then the question counts as wrong
  And the next question starts automatically
```
