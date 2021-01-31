class DudEditor {
	start() {
		alert(1)
	}

	switchToLocalStorageCommand() {}

	switchToDudServerStorageCommand() {}

	saveDudEditorSettingsCommand() {}
	reloadDudEditorSettingsCommand() {}

	savePostCommand() {}
	deletePostCommand() {}

	saveStampCommand() {}
	downloadStampCommand() {}
	openStampCommand() {}
	loadStampFromOnDropCommand() {}

	renameFileCommand() {}


	compileBlogToHtmlStampCommand() {}

	changeThemeCommand() {}
}


class DudStamp {
	name = ""
	content = ""
}


class DumbdownFile {
	name = ""
	content = ""
}


// Layout:

// [post][commands][preview]

// OR

// [view all. global commands.][post, post commands.][preview]