import { AppSettingsRequest, AppSettingsResponse } from '@smartthings/core-sdk'
import { APICommand, inputAndOutputItem } from '@smartthings/cli-lib'
import { buildTableOutput, chooseApp } from '../../../lib/commands/apps-util'


export default class AppSettingsUpdateCommand extends APICommand<typeof AppSettingsUpdateCommand.flags> {
	static description = 'update the settings of the app' +
		this.apiDocsURL('updateAppSettings')

	static flags = {
		...APICommand.flags,
		...inputAndOutputItem.flags,
	}

	static args = [{
		name: 'id',
		description: 'the app id',
	}]

	async run(): Promise<void> {
		const appId = await chooseApp(this, this.args.id)
		await inputAndOutputItem(this,
			{ buildTableOutput: (data: AppSettingsResponse) => buildTableOutput(this.tableGenerator, data) },
			(_, data: AppSettingsRequest) => this.client.apps.updateSettings(appId, data))
	}
}
