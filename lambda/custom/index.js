// This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
const Alexa = require('ask-sdk-core');

function getSpeechCon(type) {
  if (type) return `<say-as interpret-as='interjection'>${speechConsCorrect[getRandom(0, speechConsCorrect.length - 1)]}! </say-as><break strength='strong'/>`;
  return `<say-as interpret-as='interjection'>${speechConsWrong[getRandom(0, speechConsWrong.length - 1)]} </say-as><break strength='strong'/>`;
}

function getAnswer(firstFactor, secondFactor) {
  const result = firstFactor * secondFactor;
  return `${firstFactor} por ${secondFactor} es igual a ${result}. `;
}

function getCurrentScore(score, counter) {
  return `Tu puntuación es ${score} de ${counter}. `;
}

function getFinalScore(score, counter) {
  return `Tu puntuación final es ${score} de ${counter}. `;
}

function getRandom(min, max) {
  return Math.floor((Math.random() * ((max - min) + 1)) + min);
}

function getQuestion(firstFactor, secondFactor) {
  return `Cuánto es ${firstFactor} por ${secondFactor}?`;
}

function askQuestion(handlerInput, table) {
  console.log(">>> I am in askQuestion() for table", table);
  //GENERATING THE RANDOM QUESTION FROM DATA
  const secondFactor = getRandom(1, 10);
  const firstFactor = parseInt(table) || getRandom(1, 10);

  //GET SESSION ATTRIBUTES
  const attributes = handlerInput.attributesManager.getSessionAttributes();

  //SET QUESTION DATA TO ATTRIBUTES
  attributes.firstFactor = firstFactor;
  attributes.secondFactor = secondFactor;
  attributes.counter += 1;

  //SAVE ATTRIBUTES
  handlerInput.attributesManager.setSessionAttributes(attributes);

  const question = getQuestion(firstFactor, secondFactor);
  return question;
}

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        console.log('>>> LaunchRequestHandler - handle');
        const speechText = 'Sed bienvenidos, me podeis pedir que abra una tabla de multiplicar, que la elija yo o que os ayude. Qué quieres hacer?';
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};
const HelloWorldIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'HelloIntent';
  },
  handle(handlerInput) {
    const speechText = 'Hola Mundo!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Hola Mundo', speechText)
      .getResponse();
  },
};
const QuizIntentHandler = {
    canHandle(handlerInput) {
        console.log('>>> QuizIntentHandler canHandle');
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'QuizIntent' || handlerInput.requestEnvelope.request.intent.name === "AMAZON.StartOverIntent");
    },
    handle(handlerInput) {
        console.log(">>> QuizIntentHandler - handle");
        const response = handlerInput.responseBuilder;
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        attributes.counter = 0;
        attributes.quizScore = 0;
        const slots = handlerInput.requestEnvelope.request.intent.slots;
        
        console.log('>>> QuizIntentHandler - attributes', JSON.stringify(attributes));
        console.log('>>> QuizIntentHandler - slots', JSON.stringify(handlerInput.requestEnvelope.request.intent.slots));
        
        const table = attributes.table ? attributes.table : (slots.table ? slots.table.value : getRandom(1, 10));
        attributes.table = parseInt(table);
    
        var question = askQuestion(handlerInput, table);
        var speakOutput = `${startQuizMessage} ${table}. ` + question;
        var repromptOutput = question;

        return response.speak(speakOutput)
                   .reprompt(repromptOutput)
                   .getResponse();
    }
};
const AnswerIntentHandler = {
  canHandle(handlerInput) {
    console.log(">>> Inside AnswerIntentHandler");
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const request = handlerInput.requestEnvelope.request;

    return attributes.firstFactor !== null && attributes.secondFactor !== null &&
           request.type === 'IntentRequest' &&
           request.intent.name === 'AnswerIntent';
  },
  handle(handlerInput) {
    console.log(">>> Inside AnswerIntentHandler - handle");
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const response = handlerInput.responseBuilder;

    console.log('>>> QuizIntentHandler - attributes', JSON.stringify(attributes));
    console.log('>>> QuizIntentHandler - slots', JSON.stringify(handlerInput.requestEnvelope.request.intent.slots));
        
    var speakOutput = ``;
    var repromptOutput = ``;
    const firstFactor = attributes.firstFactor;
    const secondFactor = attributes.secondFactor;
    const answer = handlerInput.requestEnvelope.request.intent.slots.answer;
    console.log('>>> QuizIntentHandler - answer', answer);
    const isCorrect = (answer && answer.value) ? parseInt(firstFactor * secondFactor) === parseInt(answer.value) : false;
    console.log('>>> firstFactor * secondFactor === answer', firstFactor, secondFactor, answer.value, (firstFactor * secondFactor) === new Number(answer.value));

    if (isCorrect) {
      speakOutput = getSpeechCon(true);
      attributes.quizScore += 1;
      handlerInput.attributesManager.setSessionAttributes(attributes);
    } else {
      speakOutput = getSpeechCon(false);
    }

    speakOutput += getAnswer(firstFactor, secondFactor);
    var question = ``;
    //IF YOUR QUESTION COUNT IS LESS THAN 10, WE NEED TO ASK ANOTHER QUESTION.
    if (attributes.counter < 10) {
      speakOutput += getCurrentScore(attributes.quizScore, attributes.counter);
      
      // TODO: Add control if table not present...
      const table = attributes.table ? attributes.table : getRandom(1, 10);
      attributes.table = parseInt(table);
    
      question = askQuestion(handlerInput, table);
      speakOutput += question;
      repromptOutput = question;

      return response.speak(speakOutput)
      .reprompt(repromptOutput)
      .getResponse();
    }
    else {
      speakOutput += getFinalScore(attributes.quizScore, attributes.counter) + exitSkillMessage;

      return response.speak(speakOutput).getResponse();
    }
  },
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speechText = 'Puedes jugar conmigo diciendo, abre la tabla de multiplicar del 3?';

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
        
    }
};
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
                || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speechText = 'Adios!';
        return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();
    }
};
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = handlerInput.requestEnvelope.request.intent.name;
        const speechText = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speechText)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`>>> ~~~~ Error handled: ${error.message}`);
        const speechText = `Lo siento no he entendido lo que has dicho. Por favor inténtalo otra vez.`;

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};

const startQuizMessage = `Bien. Te voy a hacer 10 preguntas sobre la tabla del`;
const speechConsCorrect = ['Bien', 'Genial'];
const speechConsWrong = ['Oh'];
const exitSkillMessage = `Gracias por jugar conmigo!  Jugamos pronto!`;

// This handler acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        HelloWorldIntentHandler,
        QuizIntentHandler,
        AnswerIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler) // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    .addErrorHandlers(
        ErrorHandler)
    .lambda();
