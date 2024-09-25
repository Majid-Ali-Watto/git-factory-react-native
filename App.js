import React, { useState, useCallback } from "react";
import { Image, View, Text, FlatList,Button, SafeAreaView, TextInput, StatusBar, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from "react-native";
import * as Clipboard from "expo-clipboard"; // Use Expo Clipboard module
import gitCommands from "./constants/commandsList";
import * as Print from "expo-print";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

// Destructure the `item` from the object passed by FlatList and add a selectable checkbox
const Item = React.memo(({ item, isSelected, onSelect }) => (
	<TouchableOpacity onPress={() => onSelect(item.code)}>
		<View style={[styles.itemContainer, isSelected && styles.selectedItem]}>
			<Text style={styles.itemName}>{item.name}</Text>
			<Text style={styles.itemDescription}>{item.description}</Text>
			<Text style={styles.itemExampleTitle}>Example:</Text>
			<Text style={styles.itemExample}>{item.example}</Text>
			<View style={styles.itemCodeContainer}>
				<Text style={styles.itemCodeLabel}>Code:</Text>
				<Text style={styles.itemCode}>{item.code}</Text>
			</View>
			{/* Show if item is selected */}
			<Text style={styles.selectionText}>{isSelected ? "Selected" : "Select this command"}</Text>
		</View>
	</TouchableOpacity>
));

export default function App() {
	const [searchQuery, setSearchQuery] = useState("");
	const [filteredData, setFilteredData] = useState(gitCommands);
	const [loading, setLoading] = useState(false);
	const [hasMore, setHasMore] = useState(true); // Indicates if there's more data to load
	const [selectedCommands, setSelectedCommands] = useState([]); // Tracks selected commands

	const shareFile = async () => {
		try {
			const fileUri = FileSystem.documentDirectory + "GitCommands.pdf";
			const fileInfo = await FileSystem.getInfoAsync(fileUri);

			if (fileInfo.exists) {
				await Sharing.shareAsync(fileUri, {
					mimeType: "application/pdf",
					dialogTitle: "Share PDF"
				});
			} else {
				Alert.alert("Error", "PDF file does not exist");
			}
		} catch (error) {
			console.error("Sharing Error:", error);
		}
	};

	// Memoize the filter function
	const handleFilter = useCallback((query) => {
		setSearchQuery(query);
		const lowercasedQuery = query.toLowerCase();
		const filtered = gitCommands.filter((command) => {
			const { code, name, description, basic } = command;
			return [name, description, code, basic].some((cmd) => cmd?.toLowerCase()?.includes(lowercasedQuery));
		});
		setFilteredData(filtered);
	}, []);

	// Function to load more data (simulate API call)
	const loadMoreData = useCallback(() => {
		if (loading || !hasMore) return;
		setLoading(true);

		// Simulate an API call with a timeout
		setTimeout(() => {
			const moreData = [
				// Add additional data items here
			];
			setFilteredData((prevData) => [...prevData, ...moreData]);
			setLoading(false);
			setHasMore(moreData.length > 0); // Update based on whether more data exists
		}, 2000);
	}, [loading, hasMore]);

	// Toggle selection for a command
	const handleSelectCommand = useCallback((command) => {
		setSelectedCommands((prevSelected) => (prevSelected.includes(command) ? prevSelected.filter((c) => c !== command) : [...prevSelected, command]));
	}, []);

	// Copy selected commands to clipboard
	const handleCopySelected = () => {
		if (selectedCommands.length === 0) {
			Alert.alert("No Commands Selected", "Please select commands to copy.");
			return;
		}

		// Find the selected commands from the original list
		const selectedCommandsData = gitCommands.filter((cmd) => selectedCommands.includes(cmd.code));
		const commandsText = selectedCommandsData.map((cmd) => `${cmd.code}`).join("\n");

		Clipboard.setString(commandsText); // Copy to clipboard using Expo's Clipboard API
		Alert.alert("Success", "Selected commands copied to clipboard!");
	};

	// Select all commands
	const handleSelectAll = useCallback(() => {
		const allCommandNames = filteredData.map((cmd) => cmd.code);
		setSelectedCommands(allCommandNames);
	}, [filteredData]);

	// Unselect all commands
	const handleUnselectAll = useCallback(() => {
		setSelectedCommands([]);
	}, []);
	const generatePDF = async () => {
		try {
			// Convert the list of commands to HTML
			const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { padding: 20px; }
            .item { margin-bottom: 15px; }
            .name { font-weight: bold; }
            .description,.example,.code { margin: 5px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Git Commands</h1>
            ${filteredData
							.map(
								(command) => `
                <div class="item">
                  <div class="name">${command.name}</div>
                  <div class="description">${command.description}</div>
                   <div class="example">${command.example}</div>
                  <div class="code">${command.code}</div>
                </div>
              `
							)
							.join("")}
          </div>
        </body>
      </html>
    `;

			// Create PDF from HTML
			const { uri } = await Print.printToFileAsync({
				html: htmlContent
			});

			// Copy the file to the device's document directory
			const fileUri = FileSystem.documentDirectory + "GitCommands.pdf";
			await FileSystem.moveAsync({
				from: uri,
				to: fileUri
			});

			Alert.alert("Success", `PDF file saved to: ${fileUri}`);
		} catch (error) {
			console.error("PDF Generation Error:", error);
			Alert.alert("Error", "Failed to generate PDF");
		}
	};

	return (
		<>
			<StatusBar
				barStyle="light-content"
				backgroundColor="darkblue"
			/>
			<SafeAreaView style={styles.container}>
				{/* Search Input */}
				<TextInput
					style={styles.searchInput}
					placeholder="Type `basic commands`/Search commands"
					placeholderTextColor="#999"
					value={searchQuery}
					onChangeText={handleFilter}
					keyboardType="default"
				/>

				<View style={styles.iconsSection}>
					{/* Download selected or all in pdf document */}
					<TouchableOpacity onPress={generatePDF}>
						<Image
							style={styles.icons}
							source={require("./public/download.png")}
						/>
					</TouchableOpacity>
					{/* Copy selected */}
					<TouchableOpacity onPress={handleCopySelected}>
						<Image
							style={styles.icons}
							source={require("./public/copy.png")}
						/>
					</TouchableOpacity>
					{/* Select all */}
					<TouchableOpacity onPress={handleSelectAll}>
						<Image
							style={styles.icons}
							source={require("./public/select.png")}
						/>
					</TouchableOpacity>
					{/* Un-select all */}
					<TouchableOpacity onPress={handleUnselectAll}>
						<Image
							style={styles.icons}
							source={require("./public/delete.png")}
						/>
					</TouchableOpacity>
				</View>
				<Button
					title="Share PDF"
					onPress={shareFile}
				/>
				{/* Command List */}
				<View style={styles.innerContainer}>
					<FlatList
						data={filteredData}
						keyExtractor={(item) => item.code}
						renderItem={({ item }) => (
							<Item
								item={item}
								isSelected={selectedCommands.includes(item.code)}
								onSelect={handleSelectCommand}
							/>
						)}
						ListEmptyComponent={<Text style={styles.emptyListText}>No commands found</Text>}
						ListFooterComponent={
							loading ? (
								<ActivityIndicator
									size="large"
									color="#0000ff"
								/>
							) : null
						}
						onEndReached={loadMoreData}
						onEndReachedThreshold={0.5}
						initialNumToRender={10}
						maxToRenderPerBatch={10}
						windowSize={10}
					/>
				</View>
			</SafeAreaView>
		</>
	);
}

// Styles for the app
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f0f4f7",
		paddingHorizontal: 10
	},
	searchInput: {
		height: 50,
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 10,
		paddingHorizontal: 15,
		fontSize: 16,
		marginVertical: 20,
		backgroundColor: "#fff"
	},
	iconsSection: {
		backgroundColor: "#4A90E2",
		padding: 5,
		borderRadius: 10,
		flexDirection: "row",
		justifyContent: "space-between",
		marginVertical: 1
	},
	icons: { width: 40, height: 40 },

	innerContainer: {
		flex: 1,
		width: "100%"
	},
	itemContainer: {
		backgroundColor: "#4A90E2",
		padding: 15,
		marginVertical: 8,
		borderRadius: 10,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 5,
		elevation: 3
	},
	selectedItem: {
		backgroundColor: "#1C3D72"
	},
	itemName: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#fff",
		marginBottom: 5
	},
	itemDescription: {
		fontSize: 14,
		color: "#E5E5E5",
		marginBottom: 8
	},
	itemExampleTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: "#E0E0E0",
		marginTop: 10
	},
	itemExample: {
		fontSize: 14,
		fontStyle: "italic",
		color: "#fff",
		marginBottom: 10
	},
	itemCodeContainer: {
		backgroundColor: "#1C3D72",
		padding: 10,
		borderRadius: 5,
		marginTop: 10
	},
	itemCodeLabel: {
		fontWeight: "bold",
		color: "#ccc",
		marginBottom: 5
	},
	itemCode: {
		fontFamily: "monospace",
		fontSize: 14,
		color: "#ffffff"
	},
	selectionText: {
		fontSize: 14,
		fontWeight: "bold",
		color: "#FFD700",
		marginTop: 10,
		textAlign: "right"
	},
	emptyListText: {
		textAlign: "center",
		color: "#000",
		marginTop: 50,
		fontSize: 18
	}
});
