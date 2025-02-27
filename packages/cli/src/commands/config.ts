import yaml from 'js-yaml'
import { Flags } from '@oclif/core'

import {
	buildOutputFormatter,
	calculateOutputFormat,
	IOFormat,
	outputItem,
	outputList,
	outputItemOrList,
	SmartThingsCommand,
	stringTranslateToId,
	TableFieldDefinition,
	writeOutput,
	OutputListConfig,
} from '@smartthings/cli-lib'


function reservedKey(key: string): boolean {
	return key === 'logging'
}

export interface ConfigData {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[name: string]: any
}

export class ConfigItem {
	public name: string
	public active: string
	token: string
	apiUrl?: string
	data: ConfigData

	constructor(key: string, data: ConfigData, profileName: string) {
		this.name = key
		this.active = reservedKey(key) ? 'N/A' : key === profileName ? 'true' : ''
		this.token = data?.token ?? ''
		this.apiUrl = data?.clientIdProvider?.baseURL ?? ''
		this.data = data
	}
}

export default class ConfigCommand extends SmartThingsCommand<typeof ConfigCommand.flags> {
	static description = 'list config file entries'

	static flags = {
		...SmartThingsCommand.flags,
		...outputItemOrList.flags,
		verbose: Flags.boolean({
			description: 'Include additional data in table output',
			char: 'v',
		}),
	}

	static args = [{
		name: 'name',
		description: 'the config name',
	}]

	async run(): Promise<void> {
		const listTableFieldDefinitions: TableFieldDefinition<ConfigItem>[] = [
			'name',
			{ label: 'Active', value: (item) => reservedKey(item.name) ? 'N/A' : item.active ? 'true' : '' },
		]
		const tableFieldDefinitions: TableFieldDefinition<ConfigItem>[] = [
			...listTableFieldDefinitions,
			{ label: 'Definition', value: (item) => yaml.dump(item.data) },
		]

		const outputListConfig: OutputListConfig<ConfigItem> = {
			primaryKeyName: 'name',
			sortKeyName: 'name',
			listTableFieldDefinitions,
		}
		if (this.flags.verbose) {
			outputListConfig.listTableFieldDefinitions.push('token')
		}

		const getConfig = async (name: string): Promise<ConfigItem> => {
			const config = this.cliConfig.mergedProfiles
			return new ConfigItem(name, config[name], this.profileName)
		}
		const listConfigs = async (): Promise<ConfigItem[]> => {
			const config = this.cliConfig.mergedProfiles
			const list = Object.keys(config).map(it => {
				return new ConfigItem(it, config[it], this.profileName)
			})
			if (this.flags.verbose && !!list.find(it => it.data?.clientIdProvider?.baseURL)) {
				listTableFieldDefinitions.push('apiUrl')
			}
			return list
		}

		if (this.args.name) {
			const id = await stringTranslateToId(outputListConfig, this.args.name, listConfigs)
			await outputItem(this, { tableFieldDefinitions }, () => getConfig(id))
		} else {
			const outputFormat = calculateOutputFormat(this)
			if (outputFormat === IOFormat.COMMON) {
				await outputList(this, outputListConfig, listConfigs, true)
			} else {
				const outputFormatter = buildOutputFormatter(this)
				await writeOutput(outputFormatter(this.cliConfig.mergedProfiles), this.flags.output)
			}
		}
	}
}
