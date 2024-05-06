/*******************************************
 * Dramatic Task Planner macro
 * version 1.0.1
 * (c): SalieriC, original idea and code base: brunocalado.
 ******************************************/

export async function dramatic_task_planner_script(img) {
    let chatimage = 'icons/commodities/tech/detonator-timer.webp';
    const targetsArray = Array.from(game.user.targets)
    const sfx = 'modules/swim/assets/sfx/Dramatic-drum-hit-orangefreesounds.com.ogg'
    const volume = game.settings.get("swim", "defaultVolume")
    let dramaticTaskLink = await swim.get_official_journal_link("dramatic_tasks")
    if (dramaticTaskLink) {
        dramaticTaskLink += `{${game.i18n.localize("SWIM.dramaticTask")}}`
    } else {
        dramaticTaskLink = game.i18n.localize("SWIM.dramaticTask")
    }
    const officialClass = await swim.get_official_class()

    if (img) {
        chatimage = img
    }
    const challengeTrackerInstalled = game.modules.get('challenge-tracker')?.active
    let players = 1
    if (targetsArray.length > 0) {
        players = targetsArray.length
    }
    let template = `
    <style type="text/css">
    .tg  {border-collapse:collapse;border-spacing:0;}
    .tg td{border-color:black;border-style:solid;border-width:0px;font-family:Arial, sans-serif;font-size:14px;
        overflow:hidden;padding:10px 5px;word-break:normal;}
    .tg th{border-color:black;border-style:solid;border-width:0px;font-family:Arial, sans-serif;font-size:14px;
        font-weight:normal;overflow:hidden;padding:10px 5px;word-break:normal;}
    .tg .tg-xwyw{border-color:#000000;text-align:center;vertical-align:middle}
    .tg .tg-0lax{border-color:#000000;text-align:center;vertical-align:middle}
    </style>

    ${officialClass}
    <table class="tg">
    <h1>${dramaticTaskLink}</h1>
    <tbody>
        <tr>
            <td class="tg-xwyw">
                    <b>${game.i18n.localize("SWIM.word-Player")}</b>
                    <p>
                    <input id="playersAmount" type="number" min="1" max="100" value="${players}">  
                    </p>
            </td>
            <td class="tg-0lax">
                <b>${game.i18n.localize("SWIM.word-Difficulty")}</b>
                <p>
                <select id="difficult" name="difficulty">
                    <option value="challenging" selected="selected">${game.i18n.localize("SWIM.taskDifficulty-Challenging")}</option>
                    <option value="difficult">${game.i18n.localize("SWIM.taskDifficulty-Difficult")}</option>
                    <option value="complex">${game.i18n.localize("SWIM.taskDifficulty-Complex")}</option>
                </select>  
                </p>
            </td>
        </tr>

        <tr>
            <td class="tg-xwyw" colspan="2">
                <h3>${game.i18n.localize("SWIM.task-custom")}</h3>
                <p>${game.i18n.localize("SWIM.dialogue.task-customHint")}</p>
            </td>
        </tr>

        <tr>
            <td class="tg-xwyw">
                    <b>${game.i18n.localize("SWIM.word-Tokens")}</b>
                    <p>
                        <input id="customTokens" type="number" min="1" max="100" value="0">    
                    </p>
            </td>
            <td class="tg-0lax">
                <b>${game.i18n.localize("SWIM.word-Turns")}</b>
                <p>
                    <input id="customTurns" type="number" min="1" max="100" value="0">    
                </p>
            </td>
        </tr>

        <tr>
            <td class="tg-xwyw" colspan="2">
                <h3><b>${game.i18n.localize("SWIM.word-Options")}</b></h3>
            </td>
        </tr>
    `
    if (challengeTrackerInstalled) {
        template += `
        <tr>
            <td class="tg-xwyw">
                <b>Challenge Tracker (CT)</b>
            </td>
            <td class="tg-xwyw">
                <input id="challengeTracker" type="checkbox" checked>
            </td>    
        </tr>
        <tr>
            <td class="tg-xwyw">
                <b>CT ${game.i18n.localize("challengeTracker.labels.editForm.trackerOptions.windowed")}</b>
            </td>
            <td class="tg-xwyw">
                <input id="challengeTrackerWindowed" type="checkbox" checked>
            </td>    
        </tr>
        <tr>
            <td class="tg-xwyw">
                <b>CT ${game.i18n.localize("SWIM.task-ct-showTurns")}</b>
            </td>
            <td class="tg-xwyw">
                <input id="challengeTrackerRounds" type="checkbox">
            </td>    
        </tr>
        <tr>
        `
    }

    template += `
            <td class="tg-xwyw">
                <b>${game.i18n.localize("SWIM.task-taskPerPlayer")}</b>
            </td>
            <td class="tg-xwyw">
                <input id="taskPerPlayer" type="checkbox">
            </td>    
        </tr>
        <tr>
            <td class="tg-xwyw">
                <b>${game.i18n.localize("SWIM.task-playSFX")}</b>
            </td>
            <td class="tg-xwyw">
                <input id="playSfx" type="checkbox", checked>
            </td>    
        </tr>
        
    </tbody>
    </div>
    </table>
    `

    new Dialog({
        title: game.i18n.localize("SWIM.dramaticTask"),
        content: await TextEditor.enrichHTML(template),
        buttons: {
            ok: {
                label: game.i18n.localize("SWIM.dialogue-accept"),
                callback: async (html) => {
                    dramaticTask(html);
                },
            },
            cancel: {
                label: game.i18n.localize("SWIM.dialogue-cancel"),
            }
        },
        default: "ok"
    }, {}).render(true);

    async function dramaticTask(html) {
        const players = Number(html.find("#playersAmount")[0].value);
        const difficulty = html.find("#difficulty")[0].value;
        const customTokens = html.find("#customTokens")[0].value;
        const customTurns = html.find("#customTurns")[0].value;
        const challengeTracker = html.find("#challengeTracker")[0].checked;
        const challengeTrackerWindowed = html.find("#challengeTrackerWindowed")[0].checked;
        const challengeTrackerRounds = html.find("#challengeTrackerRounds")[0].checked;
        const taskPerPlayer = html.find("#taskPerPlayer")[0].checked;
        const playSfx = html.find("#playSfx")[0].checked;
        let useNames = false
        if (targetsArray.length === players && taskPerPlayer) {
            useNames = true
        }

        let message = ``;
        message = `<h2><img style="vertical-align:middle" src=${chatimage} width="28" height="28"> ${dramaticTaskLink}</h2>`;

        if (taskPerPlayer) {
            for (let i = 0; i < players; i++) {
                let nameOfPlayer = false
                if (targetsArray.length > 0) {
                    nameOfPlayer = targetsArray[i].name
                }
                if (customTokens != 0 && customTurns != 0) {
                    message += customDramaticTask(customTokens, customTurns, challengeTracker, challengeTrackerWindowed, challengeTrackerRounds, useNames, nameOfPlayer);
                } else {
                    message += calculateTaskTokens(1, difficulty, challengeTracker, challengeTrackerWindowed, challengeTrackerRounds, useNames, nameOfPlayer);
                }
            }
        } else {
            if (customTokens != 0 && customTurns != 0) {
                message += customDramaticTask(customTokens, customTurns, challengeTracker, challengeTrackerWindowed, challengeTrackerRounds, useNames);
            } else {
                message += calculateTaskTokens(players, difficulty, challengeTracker, challengeTrackerWindowed, challengeTrackerRounds, useNames);
            }
        }

        // send message
        let chatData = {
            content: await TextEditor.enrichHTML(officialClass + message + '</div>'),
            whisper: ChatMessage.getWhisperRecipients("GM")
        };
        ChatMessage.create(chatData, {});
        if (playSfx) {
            swim.play_sfx(sfx, volume, true)
        }
    }

    function calculateTaskTokens(players, difficulty, challengeTracker = false, challengeTrackerWindowed = false, challengeTrackerRounds = false, useNames = false, nameOfPlayer = false) {
        let tasksTokens = 0;
        let tasksTurns = 0;
        let difficultyName = '';
        let message = ``;
        if (difficulty == 'challenging') {
            tasksTokens = players * 4;
            tasksTurns = 3;
            difficultyName = game.i18n.localize("SWIM.taskDifficulty-challenging")
        } else if (difficulty == 'difficult') {
            tasksTokens = players * 6;
            tasksTurns = 4;
            difficultyName = game.i18n.localize("SWIM.taskDifficulty-difficult")
        } else if (difficulty == 'complex') {
            tasksTokens = players * 8;
            tasksTurns = 5;
            difficultyName = game.i18n.localize("SWIM.taskDifficulty-complex")
        }
        let playersCountWord = game.i18n.localize("SWIM.word-players")
        if (players === 1) {
            playersCountWord = game.i18n.localize("SWIM.word-player")
        }
        let playerName = `<b>${players}</b> ${playersCountWord}`
        if (useNames) {
            playerName = `<b>${nameOfPlayer}</b>`
        }
        //message += `<p>This is <b>${difficultyName}</b> for ${playerName}.</p><ul><li>Task Tokens: <b style="color:red;">${tasksTokens}</b></li><li>Rounds: <b style="color:red;">${tasksTurns}</b></p></ul>`
        message += game.i18n.format("SWIM.task.message.main", {difficultyName, playerName, tasksTokens, tasksTurns})

        if (challengeTracker) {
            let title = game.i18n.localize("SWIM.dramaticTask")
            if (useNames) {
                title += ` ${game.i18n.localize("SWIM.word-for")} ${nameOfPlayer}`
            }
            ChallengeTracker.open({
                outerTotal: tasksTokens,
                innerTotal: challengeTrackerRounds ? tasksTurns : 0,
                title: title,
                windowed: challengeTrackerWindowed
            })
        }

        return message;
    }

    function customDramaticTask(tokens, turns, challengeTracker = false, challengeTrackerWindowed = false, challengeTrackerRounds = false, useNames = false, nameOfPlayer = false) {
        let message = ``
        if (useNames) {
            message = `${game.i18n.localize("SWIM.dramaticTask")} ${game.i18n.localize("SWIM.word-for")} <b>${nameOfPlayer}</b>:`
        }
        //message += `<ul><li>Task Tokens: <b style="color:red;">${tokens}</b></li><li>Rounds: <b style="color:red;">${turns}</b></p></ul>`
        message += game.i18n.format("SWIM.task.message.customTask", {tokens, turns})

        if (challengeTracker) {
            let title = game.i18n.localize("SWIM.dramaticTask")
            if (useNames) {
                title += ` ${game.i18n.localize("SWIM.word-for")} ${nameOfPlayer}`
            }
            ChallengeTracker.open({
                outerTotal: tokens,
                innerTotal: challengeTrackerRounds ? turns : 0,
                title: title,
                windowed: challengeTrackerWindowed
            })
        }

        return message;
    }
}