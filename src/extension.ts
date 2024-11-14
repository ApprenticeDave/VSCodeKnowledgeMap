// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as kx from './knowledgegraph';
import * as fileparse from './fileParser';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscodeknowledgemap" is now active!');

	const mapViewDisposable = vscode.commands.registerCommand('vscodeknowledgemap.OpenMapView', () => {
		const panel = vscode.window.createWebviewPanel(
            'vscodeknowledgemapOpenMapView', // Identifies the type of the webview. Used internally
            'Knowledge Map', // Title of the panel displayed to the user
            vscode.ViewColumn.One, // Editor column to show the new webview panel in
            {} // Webview options. More on these later.
        );

		panel.webview.html = getMapViewContent();
	});

	context.subscriptions.push(mapViewDisposable);
}

function getMapViewContent(){
	return '';
};

// This method is called when your extension is deactivated
export function deactivate() {}
