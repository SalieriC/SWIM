import { SwimItem } from "./scripts/swimitem.js";
const swimTab = [];

export class swimTab {
    static bind(app, html, data) {
        let acceptedTypes = ['weapon', 'power'];
        if (acceptedTypes.includes(data.entity.type)) {
            let tab = swimTab[app.id];
            if (!tab) {
                tab = new swim_Tab(app);
                swimTab[app.id] = tab;
            }
            tab.init(html, data);
        }
    }

    constructor(app) {
        this.app = app;
        this.item = app.item;
        this.itemName = this.item.name.toLowerCase();
        this.hack(this.app);
        this.activate = false;
    }

    init(html, data) {

        if (html[0].localName !== "div") {
            html = $(html[0].parentElement.parentElement);
        }

        tabs = html.find('form nav.flexrow.tabs');

        tabs.first().append($(
            '<a class="item" data-tab="swim">SWIM</a>'
        ));

        $(html.find('.sheet-header')).append($(
            '<div class="tab swim-items" data-group="primary" data-tab="swim"></div>'
        ))

        this.html = html;
        this.editable = data.editable;

        let itemData = getNameColor(data);

        this.swimItem = new SwimItem(this.item.data.flags.swim, itemData);

        this.render();
    }

    // Do I need this?
    /*
    hack(app) {
        let tab = this;
        app.setPosition = function (position = {}) {
            position.height = tab.isActive() && !position.height ? "auto" : position.height;
            return this.__proto__.__proto__.setPosition.apply(this, [position])
        };
    }
    */

    async render() {


        let template = await renderTemplate('modules/swim/templates/swimtab.html', this.swimItem);
        let el = this.html.find('.animation-tab-contents');
        if (el.length) {
            el.replaceWith(template);
        } else {
            this.html.find('.tab.animate-items').append(template);
        }
    }
}