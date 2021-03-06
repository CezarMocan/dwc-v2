import * as PIXI from 'pixi.js'
import { DWC_META } from '../../../../shared-constants';
import { randomElementFromArray, randomIntInRange, sleep } from '../utils';
import MushroomParticle from './MushroomParticle';

export default class MushroomCluster extends PIXI.Container {
    constructor(params, creatureName) {
        super()
        this.params = params
        const { creatureType, svgElementIndex, evolutionIndex, evolutions, scale, rotation, fillColor } = params
        this.fillColor = fillColor
        this.creatureType = creatureType
        this.elementType = Object.values(DWC_META.creaturesNew[creatureType])[svgElementIndex].name

        this.evolutions = evolutions
        this.evolutionIndex = evolutionIndex % evolutions.length
        
        const { mainSectionChildren, mirrorSectionScale, mirrorSectionChildren, mirrorSectionParentIndex } = this.evolutions[this.evolutionIndex]

        this.creature = new PIXI.Container()

        this.creatureTop = new MushroomParticle(this.creatureType, this.elementType, mainSectionChildren, fillColor)        
        this.creatureBottom = this.generateChildFromParameters(this.evolutions[this.evolutionIndex])
        
        this.creature.addChild(this.creatureTop)
        this.creature.addChild(this.creatureBottom)

        const bbox = this.creature.getLocalBounds()
        this.addChild(this.creature)

        const textStyle = new PIXI.TextStyle({
            fontSize: 50,
            fill: fillColor,
            fontFamily: 'Dongle',
            stroke: "white",
        })
        const message = new PIXI.Text(creatureName, textStyle);
        message.scale.set(0.25)
        // message.position.set(bbox.width - message.getBounds().width / 2, bbox.y + bbox.height + 10 - message.getBounds().height / 2)        
        message.position.set(bbox.width / 2 - message.getLocalBounds().width / 8, bbox.height + 3)
        this.addChild(message)
        this.message = message

        const selfBbox = this.getBounds()

        this.pivot.set(selfBbox.width / 2, selfBbox.height / 2)
        this.scale.set(scale)
        this.rotation = rotation      

        this.frame = 0
        this.isAnimatingGrowth = false
    }

    generateChildFromParameters({ mirrorSectionChildren, mirrorSectionScale, mirrorSectionParentIndex, fillColor }) {
        const oldRotation = this.rotation
        this.rotation = 0

        const creatureBottom = new MushroomParticle(this.creatureType, this.elementType, mirrorSectionChildren, this.fillColor)
        creatureBottom.scale.set(mirrorSectionScale, mirrorSectionScale)
        const bottomBBox = creatureBottom.getBounds()                
        
        const childBounds = this.creatureTop.getChildBounds(mirrorSectionParentIndex)
        const gX = childBounds.x + childBounds.width
        const gY = childBounds.y + childBounds.height / 2
        const pos = this.creature.toLocal(new PIXI.Point(gX, gY))
        creatureBottom.position.set(pos.x, pos.y - bottomBBox.height / 2)
        this.rotation = oldRotation

        return creatureBottom
    }

    async evolve(duration) {
        this.startedEvolving = true
        this.evolutionIndex = (this.evolutionIndex + 1) % this.evolutions.length
        let currEvolution = this.evolutions[this.evolutionIndex]

        await this.creatureBottom.startAnimatingDeath(duration)
        await this.creatureTop.updateChildrenDimensions(currEvolution.mainSectionChildrenAnims[0])
        await this.creatureTop.updateChildrenDimensions(currEvolution.mainSectionChildrenAnims[1])
        await this.creatureTop.updateChildrenDimensions(currEvolution.mainSectionChildren)
        this.creature.removeChild(this.creatureBottom)
        this.creatureBottom = this.generateChildFromParameters(currEvolution)
        this.creature.addChild(this.creatureBottom)
        await this.creatureBottom.startAnimatingGrowth(1500)
        this.startedEvolving = false
        // await this.evolve(1500)
    }

    async startAnimatingGrowth(elementDuration) {
        if (this.isAnimatingGrowth) return
        this.isAnimatingGrowth = true

        this.creatureTop.hideAll()
        this.creatureBottom.hideAll()
        await this.creatureTop.startAnimatingGrowth(elementDuration)        
        await this.creatureBottom.startAnimatingGrowth(elementDuration)
        await sleep(2000)

        this.isAnimatingGrowth = false
        // await this.evolve(1500)
    }

    getNumberOfElements() {
        return this.creature.getNumberOfElements()
    }

    tick() {
        this.creature.children.forEach(c => c.tick())
    }
}