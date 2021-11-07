class swim {
    static async start_macro(macroName, compendiumName='swim.swade-immersive-macros') {  
        let pack = game.packs.get(compendiumName);
        let macro = ( await pack.getDocuments() ).find(i => (i.data.name==macroName) );
        await macro.execute();
      }
}