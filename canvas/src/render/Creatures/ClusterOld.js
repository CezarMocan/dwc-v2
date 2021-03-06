import * as PIXI from 'pixi.js'
import { DWC_META } from '../../../../shared-constants';
import SVGCreatureShape from '../Geometry/SVGCreatureShape';
import { randomElementFromArray, randomIntInRange } from '../utils';
import Particle from './ParticleOld';
import { BlurFilter } from '@pixi/filter-blur';
import gradientFragment from '../shaders/radialGradient.glsl'
import vertex from "../shaders/vertex.glsl";

export default class Cluster extends PIXI.Graphics {
    constructor(creatureType, elementAIndex, elementBIndex) {
        super()
        this.creatureType = creatureType        

        this.elementA = Object.values(DWC_META.creaturesNew[creatureType])[elementAIndex].name
        this.elementB = Object.values(DWC_META.creaturesNew[creatureType])[elementBIndex].name
        let c1, c2
        c1 = this.getElementParams(this.elementA, 2, 3)
        if (Math.random() < 0.5 || this.elementA != this.elementB) {
            c2 = this.getElementParams(this.elementB, 1, 3)
        } else {
            c2 = c1
        }

        this.top = new PIXI.Graphics()

        //let skew = randomElementFromArray([0, 0, 0, Math.PI / 4, Math.PI / 8])
        let skew = 0

        this.creature = new Particle(this.creatureType, this.elementA, c1.noElements, c1.elementsProps)
        this.creature.skew.x = -skew
        this.top.addChild(this.creature)

        this.creature2 = new Particle(this.creatureType, this.elementB, c2.noElements, c2.elementsProps)
        if (Math.random() < 0.5) {
            this.creature2.scale.set(-1, 1)
            this.creature2.x = 2 * this.creature2.getBounds().width    
        } else {
            this.creature2.x = 1 * this.creature2.getBounds().width
        }
        this.creature2.skew.x = skew
        this.top.addChild(this.creature2)

        var texture = window.DWCApp.renderer.generateTexture(this.top);
        let sp = new PIXI.Sprite(texture)
        sp.scale.set(0.4, 0.4)
        sp.x = -220
        sp.y = -220        
        //this.addChild(sp)

        //this.drawElement()
        //this.drawGroup()
        //this.drawSquare()
        //this.drawCircle()
        this.drawRandom()
    }

    drawRandom() {
        let shapeMask
        let r = Math.random()

        if (r <= 1) {
            shapeMask = this.drawElement()
        } else if (r <= 0.5) {
            shapeMask = this.drawGroup()
        } else if (r <= 0.75) {
            shapeMask = this.drawSquare()
        } else {
            shapeMask = this.drawCircle()
        }
        
        // Gradient
        const bbox = shapeMask.getBounds()
          
        const gradientUniforms = {
            u_time: 1.0,
            u_radius1: 0.4, // radius of first point of radial gradient
            u_color1: [244.0 / 256, 17.0 / 256, 190.0 / 256, 1.0], // color of first point of radial gradient            
            u_radius2: 0.6, // radius of second point of radial gradient            
            u_color2: [3.0 / 256, 120.0 / 256, 245.0 / 256, 1.0], // color of second point of radial gradient
            u_color3: [0.0, 0.0, 0.0, 0.8], // color of second point of radial gradient
            u_resolution: [bbox.width, bbox.height]
        }

        const gradientFilter = new PIXI.Filter(null, gradientFragment, gradientUniforms);
        const gradientSprite = new PIXI.Sprite(PIXI.Texture.WHITE)
        gradientSprite.x = bbox.x
        gradientSprite.y = bbox.y
        gradientSprite.width = bbox.width
        gradientSprite.height = bbox.height
        gradientSprite.filters = [gradientFilter]        

        const container = new PIXI.Container()
        container.addChild(gradientSprite)

        var textureMask = window.DWCApp.renderer.generateTexture(shapeMask);
        var spriteMask = new PIXI.Sprite(textureMask)
        //spriteMask.scale.set(0.95)
        spriteMask.position.set(bbox.x, bbox.y)

        container.addChild(spriteMask)
        container.mask = spriteMask
        container.filters = [new BlurFilter(16, 8)]
        
        this.addChild(container)
        shapeMask.filters = [new BlurFilter(1, 2)]
        this.addChild(shapeMask)
    }

    drawElement() {
        const shapeMask = new PIXI.Graphics()
        var texture = window.DWCApp.renderer.generateTexture(this.creature);
        let sp = new PIXI.Sprite(texture)
        sp.x = -sp.width / 2
        sp.y = -sp.height / 2
        shapeMask.addChild(sp)
        return shapeMask
    }

    drawGroup() {
        const shapeMask = new PIXI.Graphics()
        var texture = window.DWCApp.renderer.generateTexture(this.top);
        let sp = new PIXI.Sprite(texture)
        sp.x = -sp.width / 2
        sp.y = -sp.height / 2
        //sp.pivot.set(sp.width / 2, sp.height / 2)
        shapeMask.addChild(sp)
        return shapeMask
    }

    drawSquare() {
        const shapeMask = new PIXI.Graphics()

        var texture = window.DWCApp.renderer.generateTexture(this.top);
        let sp = new PIXI.Sprite(texture)
        sp.x = -sp.width / 2
        sp.y = -sp.height
        let sp2 = new PIXI.Sprite(texture)
        let r = Math.random()

        if (r <= 0.25) {
            sp2.scale.set(0.5, 0.5)
            sp2.x = -sp2.width / 2
            sp2.y = 0
        } else if (r <= 0.5) {
            sp2.scale.set(-0.5, 0.5)
            sp2.x = sp2.width / 2    
        } else if (r <= 0.75) {
            sp2.scale.set(0.5, -0.5)
            sp2.x = -sp2.width / 2    
            sp2.y = sp2.height    
        } else {
            sp2.scale.set(-0.5, -0.5)
            sp2.x = sp2.width / 2    
            sp2.y = sp2.height    
        }

        //sp.pivot.set(sp.width / 2, sp.height / 2)
        shapeMask.addChild(sp)
        shapeMask.addChild(sp2)

        return shapeMask
    }

    drawCircle() {
        var texture = window.DWCApp.renderer.generateTexture(this.top);

        let radii = [0, 0.25, 0.5, 1, 1.5, 2]
        let radiusFactor = randomElementFromArray(radii)

        let totalPoints = randomElementFromArray([2, 4, 8])

        const shapeMask = new PIXI.Graphics()
        let r = 0
        for (let i = 0; i < totalPoints; i++) {
            var sprite = new PIXI.Sprite(texture);
            sprite.scale.set(1, 1)
            sprite.pivot.set(0, -sprite.height * -radiusFactor)
            sprite.rotation = r
            shapeMask.addChild(sprite);
            if (totalPoints == 4 && i == 2) {
                sprite.alpha = 0
            }                
            r += 2 * Math.PI / totalPoints
        }

        return shapeMask
    }

    getElementParams(elementType, min, max) {
        let noElements = randomIntInRange(min, max)
        let elementsProps = []
        let typeKey, nextTypeKey
        let currElementType = elementType //randomElementFromArray(Object.keys(DWC_META.creaturesNew[creatureType][elementType].connectors))

        nextTypeKey = currElementType
        for (let i = 0; i < noElements; i++) {
            typeKey = nextTypeKey
            nextTypeKey = randomElementFromArray(Object.keys(DWC_META.creaturesNew[this.creatureType][typeKey].connectors))

            elementsProps.push({
                typeKey: typeKey,
                nextTypeKey: nextTypeKey,
                connectorIndex: randomIntInRange(0, DWC_META.creaturesNew[this.creatureType][typeKey].connectors[nextTypeKey])
            })
        }

        return { type: currElementType, noElements, elementsProps }
    }
}