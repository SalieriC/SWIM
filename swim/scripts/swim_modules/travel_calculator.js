/*******************************************
 * Travel Calculator Macro
 * version v.1.0.0
 * Made and maintained by SalieriC#8263
 * Future plan: Include random encounters as
 * per the core rules pg.144.
 ******************************************/
export async function travel_calculator() {
    //Set div class based on enabled official module:
    const officialClass = await swim.get_official_class()

    const options = `
      <option value="foot">${game.i18n.localize('SWIM.travelOption-foot')}</option>
      <option value="horse">${game.i18n.localize('SWIM.travelOption-horse')}</option>
      <option value="earlyCar">${game.i18n.localize('SWIM.travelOption-earlyCar')}</option>
      <option value="modernCar">${game.i18n.localize('SWIM.travelOption-modernCar')}</option>
      <option value="sailingShip">${game.i18n.localize('SWIM.travelOption-sailingShip')}</option>
      <option value="steamShip">${game.i18n.localize('SWIM.travelOption-steamShip')}</option>
      <option value="modernShip">${game.i18n.localize('SWIM.travelOption-modernShip')}</option>
      <option value="highSpeedFerry">${game.i18n.localize('SWIM.travelOption-highSpeedFerry')}</option>
      <option value="steamTrain">${game.i18n.localize('SWIM.travelOption-steamTrain')}</option>
      <option value="modernPassengerTrain">${game.i18n.localize('SWIM.travelOption-modernPassengerTrain')}</option>
      <option value="propPlane">${game.i18n.localize('SWIM.travelOption-propPlane')}</option>
      <option value="commercialJet">${game.i18n.localize('SWIM.travelOption-commercialJet')}</option>
    `;

    new Dialog({
        title: game.i18n.localize('SWIM.dialogue-travelCalculator'),
        content: `${officialClass}
        <div>
          <label for="distance"><b>${game.i18n.localize('SWIM.word-distance')}:</b></label>
          <input type="text" id="distance" name="distance" required pattern="[0-9]+" />
        </div>
        <div>
          <label for="unit"><b>${game.i18n.localize('SWIM.word-unit')}:</b></label>
          <input type="radio" id="km" name="unit" value="km" checked>
          <label for="km">${game.i18n.localize('SWIM.word-kilometres')}</label>
          <input type="radio" id="miles" name="unit" value="miles">
          <label for="miles">${game.i18n.localize('SWIM.word-miles')}</label>
        </div>
        <div>
          <label for="method"><b>${game.i18n.localize('SWIM.dialogue-methodOfTravel')}:</b></label>
          <select id="method" name="method">${options}</select>
        </div>
        </div>
      `,
        buttons: {
            one: {
                label: game.i18n.localize('SWIM.dialogue-accept'),
                callback: (html) => {
                    const distance = html.find('[name="distance"]').val();
                    const unit = html.find('[name="unit"]:checked').val();
                    const method = html.find('[name="method"]').val();
                    calculate_results(distance, unit, method)
                },
            },
            two: {
                label: game.i18n.localize('SWIM.dialogue-cancel'),
            },
        },
        default: 'one',
        /*
        render: (html) => {
            console.log('Register interactivity in the rendered dialog');
        },
        close: (html) => {
            console.log('This is always logged no matter which option is chosen');
        },
        */
    }).render(true);
}

async function calculate_results(distance, unit, method) {
    //Have to calculate in retarded units unfortunately:
    const originalDistance = distance
    if (unit === 'km') {
        distance = distance * 0.621371192237334;
    }

    let speedPerHour;
    switch (method) {
        case 'foot':
            speedPerHour = 3;
            break;
        case 'horse':
            speedPerHour = 3.75;
            break;
        case 'earlyCar':
            speedPerHour = 25;
            break;
        case 'modernCar':
            speedPerHour = 50;
            break;
        case 'sailingShip':
            speedPerHour = 3.75;
            break;
        case 'steamShip':
            speedPerHour = 5;
            break;
        case 'modernShip':
            speedPerHour = 25;
            break;
        case 'highSpeedFerry':
            speedPerHour = 50;
            break;
        case 'steamTrain':
            speedPerHour = 7.5;
            break;
        case 'modernPassengerTrain':
            speedPerHour = 50;
            break;
        case 'propPlane':
            speedPerHour = 125;
            break;
        case 'commercialJet':
            speedPerHour = 500;
            break;
        default:
            speedPerHour = 3;
            method = 'foot';
    }

    // Calculate the result based on distance and speedPerHour
    const speedPerDay = speedPerHour * 8
    let result = distance / speedPerDay;
    //Convert result to days and hours:
    let days = Math.floor(result);
    let hours = Math.floor((result - days) * 24);
    let resultText = days + ` ${game.i18n.localize("SWIM.word-days")}` + ", " + hours + ` ${game.i18n.localize("SWIM.word-hours")}`
    show_results(originalDistance, unit, method, resultText)
}

async function show_results(distance, unit, method, resultText) {
    const officialClass = await swim.get_official_class()
    const ip = new ImagePopout(`modules/swim/assets/travel/${method}.webp`).render(true);
    ip.options.title = game.i18n.localize(`SWIM.travelOption-${method}`)
    ip.shareImage();

    //Give a little bit of time to show the dialogue above the image for the GM:
    await swim.wait('250')

    new Dialog({
        title: game.i18n.localize('SWIM.dialogue-travelCalculator'),
        content: game.i18n.format('SWIM.dialogue-travelCalculatorResults', {
            officialClass,
            distance,
            unit,
            resultText,
            method: game.i18n.localize(`SWIM.travelOption-${method}`)
        }),
        buttons: {
            one: {
                label: game.i18n.localize("SWIM.dialogue-accept"),
            }
        },
        default: "one",
    }).render(true);
}