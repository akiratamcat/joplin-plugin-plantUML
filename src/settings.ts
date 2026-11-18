import joplin from 'api'
import { ChangeEvent } from 'api/JoplinSettings'
import { SettingItem, SettingItemType } from 'api/types'
import { _ } from './i18n'

export interface Diagram {
    url: string,
    blob: string,
    imageUrl: string,
}

interface SettingItems {
    [key: string]: SettingItem,
}

const PluginReadmeUrl = 'https://github.com/akiratamcat/joplin-plugin-plantUML#readme'

export const SettingDefaults = {
    RenderingServer: 'http://www.plantuml.com/plantuml',
    // Option labels are translated in buildConfig() (i18n must be initialized first)
    RenderingType: () => ({ public: _('Official public server'), private: _('Private server') }),
    RenderingFormats: () => ({ svg: _('Vector Image (svg)'), png: _('Raster Image (png)'), txt: _('AsciiArt (txt)') }),
}

const SectionId = 'plantUML-i18n.settings'

export class Settings {

    // Settings definitions (built in register() so that labels are translated)
    private _config: SettingItems = {}

    private buildConfig(): SettingItems {
        const renderingType = SettingDefaults.RenderingType()
        const renderingFormats = SettingDefaults.RenderingFormats()
        return {
            renderingType: {
                value: Object.keys(renderingType)[0],
                type: SettingItemType.String,
                section: SectionId,
                public: true,
                advanced: false,
                isEnum: true,
                options: renderingType,
                label: _('Rendering: Type'),
                description: _('Type of renderer used to parse the PlantUML syntax and create the image. %s: %s ; %s: Host taken from the next option', renderingType.public, SettingDefaults.RenderingServer, renderingType.private),
            },
            renderingServer: {
                value: SettingDefaults.RenderingServer,
                type: SettingItemType.String,
                section: SectionId,
                public: true,
                advanced: false,
                label: _('Rendering: Private server host (optional)'),
                description: _('Private rendering server for plantUML. This server is used only if the Rendering Type is "%s"', renderingType.private),
            },
            renderingFormats: {
                value: Object.keys(renderingFormats)[0],
                type: SettingItemType.String,
                section: SectionId,
                public: true,
                advanced: false,
                isEnum: true,
                options: renderingFormats,
                label: _('Rendering: Output image format'),
                description: _('Type of image format generated while rendering the diagram.'),
            },
            diagramHeaderFile: {
                value: '',
                type: SettingItemType.String,
                section: SectionId,
                public: true,
                advanced: false,
                label: _('Diagram: Header file'),
                description: _('Path to the file containing the diagram header. The content of this file will be injected at the begin of each plantUML diagram in your notes.'),
            },
        }
    }

    // Checks on the settings
    private _checks = {
        renderingServer(host: string) {
            return host.replace(/\/$/, '')
        },
    }

    // Getters
    get(key: string): any {
        if (key in this._config) {
            return this._config[key].value
        }
        throw 'Setting not found: ' + key
    }
    toObject(): any {
        return Object.keys(this._config).reduce((result, key) => {
            result[key] = this._config[key].value
            return result
        }, {})
    }

    // Register settings
    async register() {
        this._config = this.buildConfig()

        await joplin.settings.registerSection(SectionId, {
            label: 'PlantUML',
            iconName: 'fa fa-project-diagram',
            description: _('PlantUML allows you to render UML diagrams using the syntax defined at %s. For more info on the plugin: %s', 'https://plantuml.com', PluginReadmeUrl),
        })

        await joplin.settings.registerSettings(this._config)

        // Initially read settings
        await this.read()
    }

    // Get setting on change
    private async getOrDefault(event: ChangeEvent, localVar: any, setting: string): Promise<any> {
        if (!event || event.keys.includes(setting)) {
            return await joplin.settings.value(setting)
        }
        return localVar
    }

    // Store settings on change
    async read(event?: ChangeEvent) {
        for (let key in this._config) {
            this._config[key].value = await this.getOrDefault(event, this._config[key].value, key)
            if (key in this._checks) {
                this._config[key].value = this._checks[key](this._config[key].value)
                await joplin.settings.setValue(key, this._config[key].value)
            }
        }
    }
}
