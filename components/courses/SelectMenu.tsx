import React, { useState } from "react"
import { View, StyleSheet } from "react-native"
import { Button, Menu, Text } from "react-native-paper"

interface SelectMenuProps {
    label: string
    value: string
    options: string[]
    onSelect: (value: string) => void
}

export const SelectMenu = ({ label, value, options, onSelect }: SelectMenuProps) => {
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
                    <Button mode="outlined" onPress={openMenu} style={styles.button}>
                        {value}
                    </Button>
                }
            >
                {options.map((option) => (
                    <Menu.Item key={option} onPress={() => handleSelect(option)} title={option} />
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
        fontSize: 14,
        marginBottom: 6,
        color: "#666",
    },
    button: {
        width: "100%",
        borderRadius: 8,
        borderColor: "#ddd",
        backgroundColor: "#f5f5f5",
    },
})
