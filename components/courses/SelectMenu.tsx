import React, { useState } from "react"
import { View, StyleSheet } from "react-native"
import { Button, Menu, Text } from "react-native-paper"

interface SelectMenuProps {
    label: string
    value: string
    options: string[]
    onSelect: (value: string) => void
}

export const SelectMenu: React.FC<SelectMenuProps> = ({ label, value, options, onSelect }) => {
    const [visible, setVisible] = useState(false)

    const openMenu = () => setVisible(true)
    const closeMenu = () => setVisible(false)

    const handleSelect = (option: string) => {
        onSelect(option)
        closeMenu()
    }

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
            <Menu
                visible={visible}
                onDismiss={closeMenu}
                anchor={
                    <Button
                        mode="outlined"
                        onPress={openMenu}
                        style={styles.button}
                        contentStyle={styles.buttonContent}
                        labelStyle={styles.buttonLabel}
                        icon="chevron-down"
                    >
                        {value}
                    </Button>
                }
                style={styles.menu}
            >
                {options.map((option) => (
                    <Menu.Item
                        key={option}
                        onPress={() => handleSelect(option)}
                        title={option}
                        style={option === value ? styles.selectedItem : undefined}
                        titleStyle={option === value ? styles.selectedItemText : undefined}
                    />
                ))}
            </Menu>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        color: "#666",
    },
    button: {
        width: "100%",
        borderRadius: 8,
        borderColor: "#6200ee",
    },
    buttonContent: {
        height: 48,
        justifyContent: "center",
    },
    buttonLabel: {
        color: "#6200ee",
    },
    menu: {
        marginTop: 4,
        borderRadius: 8,
    },
    selectedItem: {
        backgroundColor: "#f0e6ff",
    },
    selectedItemText: {
        color: "#6200ee",
        fontWeight: "bold",
    },
})
