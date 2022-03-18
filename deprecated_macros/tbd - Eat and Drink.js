main()

async function main() {
    console.log("Tokens: ", canvas.tokens.controlled)
    if (canvas.tokens.controlled.length == 0) {
        ui.notifications.error("Selecione um token");
        return;
    }
    let actor = canvas.tokens.controlled[0].actor

    //are there any ration?
    for (const i of actor) {
        console.log("Actor: ", actor);
        let racao = i.items.find(item => item.data.name == "Rações")
        if (racao == null || racao == undefined) {
            ChatMessage.create({ content: i.name + " não possui rações suficientes" });
            return;
        }
        else {
            //subtracting the ration
            for (const i of racao) {
                await i.update({ "data.quantity": racao.data.data.quantity - 1 })
                if (i.data.data.quantity < 1) {
                    i.delete();
                    return;
                }
            }
            await ChatMessage.create({ content: token.name + " consumiu uma ração." });
        }
    }
}