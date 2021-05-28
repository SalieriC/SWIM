// This script relies on some setup in the SWADE system settings:
//
// Actor PCs should have a custom field called `lp`, numeric type, with a max value.
// The player fills in the max themselves, but the script fills in the current value
// each time it is run. This is more fiddly than using an active effect on each
// item to increment "current LP spend", but doesn't involve editing every. single.
// item. in the catalog to add the active effect, sooooooo here we are.
//
// I have house rules for vehicle mods in Sprawlrunners:
// https://paydata.org/sprawlrunners/riggers/vehicle_mods/
// In Foundry, this requires the enabling of the "vehicle mods" system setting.
// A hat-tip to @SalieriC for pointing me to the existence of mod-slots, which
// is easier than the custom stat I was using before.
//
// Finally, another custom field is needed. Actors that themselves have a cost (like 
// vehicles and drones) should have a numeric field `lp_cost`, populated with how much
// it costs to buy the drone or vehicle.

// *************************************************************************
// NB: script has minimal error checking and does write to character sheets,
// so approach with caution. I use it, and it works fine for me, but if this
// breaks your game in half then you own both bits.
// *************************************************************************

// Ugly hack alert!
//
// I need a way to detect vehicles that are owned by the PCs. 
// In my actors tab, I keep all PCs together in a single folder. This is the 
// internal ID of that folder. All vehicle actors in this folder will be
// treated as being owned by the PCs for this script, ie. their logistic and
// mod points will be tallied.
//
// Hat-tip to @SalieriC for pointing out this is better than my old, even
// hackier (!) method.
//
// ************ !!! populate the value below !!! ************
let pcActorFolderID;
let pcDroneFolderID;
let pcVehicleFolderID;
// ************ !!! populate the value above !!! ************

async function calc(){
let grandLPTotal = 0;
let grandLPTotalMax = 0;
let grandModPointTotal = 0;

let chatData = {
  user: game.user.id,
  speaker: ChatMessage.getSpeaker(),
  content: "<p><b>Total current LP spend for all chars:</b></p><ul>"
};


// Get all PCs first
let chars = game.actors.entities
    .filter(e => e.data.type === 'character' && e.hasPlayerOwner && e.data.folder===pcActorFolderID);

for(const char of chars) {
  let maxLP = char.data.data["additionalStats"]["lp"].max;

  let total = char.items
      .map(i => i.data.data.price)
      .filter(p => p > 0)
      .reduce((total, curr) => total + curr, 0);

  chatData.content += "<li>" 
      + char.name 
      + ": <b>" 
      + total 
      + "</b> of " 
      + maxLP 
      + " LP</li>";

  char.update({"data.additionalStats.lp.value": total});

  grandLPTotal += total;
  grandLPTotalMax += maxLP;
}


// Now to do vehicles
let vehicles = game.actors.entities
    .filter(e => e.data.type === 'vehicle' && e.data.folder===pcVehicleFolderID);

for(const vehicle of vehicles ) {
  // first, the mod points that have been spent on this vehicle
  let totalModPoints = vehicle.items
     .map(i => i.data.data.mods)
      .filter(m => m > 0)
      .reduce((total, curr) => total + curr, 0);

  grandModPointTotal += totalModPoints;

  // now the LP cost of everything fitted to or carried in the vehicle
  let totalLPCost = vehicle.items
     .map(i => i.data.data.price)
      .filter(p => p > 0)
      .reduce((total, curr) => total + curr, 0);

  // finally, the LP cost of the vehicle itself
  if (vehicle.data.data.additionalStats.lp_cost) {
    totalLPCost += vehicle.data.data.additionalStats.lp_cost.value;
  } else {
    console.log("Vehicle " + vehicle.name + " has no lp_cost defined.")
  }

  chatData.content += "<li>(v) " 
      + vehicle.name + ": <b>" + totalLPCost 
      + "</b> LP & <b>" + totalModPoints + "</b> MP</li>";

  grandLPTotal += totalLPCost;
}


// Now to do drones
let drones = game.actors.entities
    .filter(e => e.data.type === 'npc' && e.data.folder===pcDroneFolderID);
for(const drone of drones) {
  // two LP costs to take care of: the drone itself, and anything it is carrying

  // first, the stuff it has
  let totalLPCost = drone.items
      .map(i => i.data.data.price)
      .filter(p => p > 0)
      .reduce((total, curr) => total + curr, 0);

  // now, the drone itself - if the custom field exists
  if (drone.data.data.additionalStats.lp_cost) {
    totalLPCost += drone.data.data.additionalStats.lp_cost.value;
  } else {
    console.log("Drone " + done.name + " has no lp_cost defined.")
  }

  chatData.content += "<li>(d) " 
      + drone.name + ": <b>" + totalLPCost 
      + "</b> LP</li>";

  grandLPTotal += totalLPCost;
}


// Finish building the output, & write it to chat
chatData.content += 
    "</ul><p>Total LP spent: <b>" + grandLPTotal + "</b> of " 
    + grandLPTotalMax + "</p>"
    + "<p>Total MP spent: <b>" + grandModPointTotal+ "</b></p>"; 

ChatMessage.create(chatData, {});
}
new Dialog({
    title: 'Calculate LP & MP',
    content: `<p>Here you can calculate spent LP and MP.</p>
        <p>Please provide the folder names where the current Group of PCs and their Drones and Vehicles are located.</p>
        <p>Make sure the folder names are <b>unique</b> to work properly.</p>
        <form>
        <div class="form-group">
            <label for="name_of_pc_folder"><i class="fas fa-user-alt"></i> <b>PC Folder Name: </b></label>
            <input id="name_of_pc_folder" name="name_of_pc_folder" type="string" value="Runners" onClick="this.select();"></input>
        </div>
        <div class="form-group">
            <label for="name_of_drone_folder"><i class="fab fa-phoenix-squadron"></i> <b>Drone Folder Name: </b></label>
            <input id="name_of_drone_folder" name="name_of_drone_folder" type="string" value="Runner Drones" onClick="this.select();"></input>
        </div>
        <div class="form-group">
            <label for="name_of_vehicle_folder"><i class="fas fa-car"></i> <b>Vehicle Folder Name: </b></label>
            <input id="name_of_vehicle_folder" name="name_of_vehicle_folder" type="string" value="Runner Vehicles" onClick="this.select();"></input>
        </div>
        </form>`,
    buttons: {
        one: {
            label: `<i class="fas fa-calculator"></i>Calculate`,
            callback: (html) => {
                console.log(`start getting stuff`);
                let pcActorFolder = String(html.find("#name_of_pc_folder")[0].value);
                let pcDroneFolder = String(html.find("#name_of_drone_folder")[0].value);
                let pcVehicleFolder = String(html.find("#name_of_vehicle_folder")[0].value);
                console.log(`${pcActorFolder}`);
                pcActorFolderID = game.folders.getName(`${pcActorFolder}`).data._id;
                pcDroneFolderID = game.folders.getName(`${pcDroneFolder}`).data._id;
                pcVehicleFolderID = game.folders.getName(`${pcVehicleFolder}`).data._id;
                calc();
            }
        },
    },
    default: "one"
    // Original by docg#2827; Dialogue and slight enhancement by SalieriC#8263.
}).render(true)