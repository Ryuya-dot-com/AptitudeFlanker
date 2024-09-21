// Participant data
let participantID = '';
let trialData = [];

// Trial variables
let currentTrial = 0;
let trials = [];
let practice = true;

// Constants
const totalPracticeTrials = 12;
const totalExperimentalTrials = 120;
const stimuli = ['←', '→'];
const conditions = ['congruent', 'incongruent', 'neutral'];

// Event listeners for keypresses
document.addEventListener('keydown', handleKeyPress);

// Functions

function showInstructions() {
    participantID = document.getElementById('participant-id').value.trim();
    if (participantID === '') {
        alert('参加者IDを入力してください。');
        return;
    }
    document.getElementById('participant-id-section').style.display = 'none';
    document.getElementById('instructions').style.display = 'block';
    displayInstructions();
}

function displayInstructions() {
    document.getElementById('instructions').innerHTML = `
        <p>この課題では、中央の矢印の向きをできるだけ速く、正確に判断してください。</p>
        <p>左向きの場合は「F」キーを、右向きの場合は「J」キーを押してください。</p>
        <p>両側の矢印は無視してください。</p>
        <p>まずは練習を行います。</p>
        <button onclick="startPractice()">練習を開始</button>
    `;
}

function startPractice() {
    document.getElementById('instructions').style.display = 'none';
    generateTrials(totalPracticeTrials);
    currentTrial = 0;
    practice = true;
    nextTrial();
}

function startExperiment() {
    generateTrials(totalExperimentalTrials);
    currentTrial = 0;
    practice = false;
    nextTrial();
}

function generateTrials(numTrials) {
    trials = [];
    const trialsPerCondition = numTrials / conditions.length;
    conditions.forEach(condition => {
        for (let i = 0; i < trialsPerCondition; i++) {
            const targetDirection = stimuli[Math.floor(Math.random() * stimuli.length)];
            let flankers = '';
            if (condition === 'congruent') {
                flankers = targetDirection.repeat(2);
            } else if (condition === 'incongruent') {
                flankers = (targetDirection === '←' ? '→' : '←').repeat(2);
            } else {
                flankers = '○'.repeat(2); // Neutral condition with circles
            }
            const stimulus = flankers + targetDirection + flankers;
            trials.push({
                condition: condition,
                target: targetDirection,
                stimulus: stimulus
            });
        }
    });
    // Shuffle trials
    trials = shuffleArray(trials);
}

function nextTrial() {
    if (currentTrial >= trials.length) {
        if (practice) {
            alert('練習が終了しました。これから本番の課題を開始します。');
            startExperiment();
        } else {
            endExperiment();
        }
        return;
    }

    // Show fixation cross
    document.getElementById('fixation').style.display = 'block';
    document.getElementById('stimulus').style.display = 'none';
    document.getElementById('feedback').style.display = 'none';

    setTimeout(() => {
        // Show stimulus
        document.getElementById('fixation').style.display = 'none';
        document.getElementById('stimulus').style.display = 'block';
        document.getElementById('stimulus-text').innerText = trials[currentTrial].stimulus;
        trialStartTime = performance.now();
        responseReceived = false;

        // Set maximum response time
        responseTimeout = setTimeout(() => {
            if (!responseReceived) {
                handleNoResponse();
            }
        }, 1500); // 1500 ms maximum response time

    }, 500); // Fixation displayed for 500 ms
}

let trialStartTime = 0;
let responseReceived = false;
let responseTimeout = null;

function handleKeyPress(event) {
    if (document.getElementById('stimulus').style.display !== 'block') {
        return;
    }

    if (responseReceived) {
        return;
    }

    const key = event.key.toLowerCase();
    let response = '';
    if (key === 'f') {
        response = '←';
    } else if (key === 'j') {
        response = '→';
    } else {
        return; // Ignore other keys
    }

    responseReceived = true;
    clearTimeout(responseTimeout);
    const rt = performance.now() - trialStartTime;
    const correct = response === trials[currentTrial].target;

    // Store trial data
    trialData.push({
        participantID: participantID,
        trialNumber: currentTrial + 1,
        practice: practice,
        condition: trials[currentTrial].condition,
        stimulus: trials[currentTrial].stimulus,
        target: trials[currentTrial].target,
        response: response,
        correct: correct,
        rt: rt
    });

    // Provide feedback if in practice
    if (practice) {
        showFeedback(correct);
    } else {
        // Proceed to next trial
        currentTrial++;
        setTimeout(nextTrial, 500); // Short delay before next trial
    }
}

function handleNoResponse() {
    responseReceived = true;
    const rt = null;
    const correct = false;

    // Store trial data with missed response
    trialData.push({
        participantID: participantID,
        trialNumber: currentTrial + 1,
        practice: practice,
        condition: trials[currentTrial].condition,
        stimulus: trials[currentTrial].stimulus,
        target: trials[currentTrial].target,
        response: 'No Response',
        correct: correct,
        rt: rt
    });

    if (practice) {
        showFeedback(correct, true);
    } else {
        currentTrial++;
        setTimeout(nextTrial, 500);
    }
}

function showFeedback(correct, noResponse = false) {
    document.getElementById('stimulus').style.display = 'none';
    document.getElementById('feedback').style.display = 'block';
    if (noResponse) {
        document.getElementById('feedback-text').innerText = '時間切れ';
    } else {
        document.getElementById('feedback-text').innerText = correct ? '正解' : '誤り';
    }

    setTimeout(() => {
        document.getElementById('feedback').style.display = 'none';
        currentTrial++;
        nextTrial();
    }, 1000); // Feedback displayed for 1000 ms
}

function endExperiment() {
    document.getElementById('stimulus').style.display = 'none';
    document.getElementById('completion').style.display = 'block';
}

function downloadData() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ParticipantID,TrialNumber,Practice,Condition,Stimulus,Target,Response,Correct,RT\n";

    trialData.forEach(trial => {
        csvContent += `${trial.participantID},${trial.trialNumber},${trial.practice},${trial.condition},` +
            `"${trial.stimulus}",${trial.target},${trial.response},${trial.correct},${trial.rt}\n`;
    });

    let encodedUri = encodeURI(csvContent);
    let link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${participantID}_flanker_data.csv`);
    document.body.appendChild(link);
    link.click();
}

// Utility functions
function shuffleArray(array) {
    let currentIndex = array.length, randomIndex;

    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // Swap with current element
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}
