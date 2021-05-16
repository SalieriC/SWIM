export class SwimItem {

    constructor(flags, itemData) {
        this.data = mergeObject(this.defaultData(), flags, { inplace: true });

        this.killAnim = this.data.killAnim;
        this.override = this.data.override;
        this.animName = this.data.animName;
        this.color = this.data.color;
        this.animType = this.data.animType;
        this.explosion = this.data.explosion;
        this.explodeColor = this.data.explodeColor;
        this.explodeRadius = this.data.explodeRadius;
        this.explodeVariant = this.data.explodeVariant;
        this.itemName = itemData[0];
        this.animTypeVar = itemData[1];
        this.explodeLoop = this.data.explodeLoop;
        this.selfRadius = this.data.selfRadius;
        //this.itemNameSys = itemData[2];
        this.dtvar = this.data.dtvar;
        this.animTint = this.data.animTint;
        this.auraOpacity = this.data.auraOpacity;
        this.ctaOption = this.data.ctaOption;
        this.hmAnim = this.data.hmAnim;
        //this.flagObject = Object.assign({}, this.data);
    }
}