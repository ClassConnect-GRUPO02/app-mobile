import React from "react"
import { useState } from "react"
import { View, StyleSheet, Modal, TouchableOpacity } from "react-native"
import { Button, Text, IconButton, Surface } from "react-native-paper"
import { Calendar, type DateData } from "react-native-calendars"

interface DateRangePickerProps {
    startDate: string
    endDate: string
    onDatesChange: (startDate: string, endDate: string) => void
    startDateError?: string
    endDateError?: string
}

type MarkedDates = {
    [date: string]: {
        startingDay?: boolean
        endingDay?: boolean
        selected?: boolean
        color?: string
        textColor?: string
    }
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
                                                                    startDate,
                                                                    endDate,
                                                                    onDatesChange,
                                                                    startDateError,
                                                                    endDateError,
                                                                }) => {
    const [modalVisible, setModalVisible] = useState(false)
    const [tempStartDate, setTempStartDate] = useState(startDate)
    const [tempEndDate, setTempEndDate] = useState(endDate)
    const [selectingStart, setSelectingStart] = useState(true)

    const formatDisplayDate = (dateString: string) => {
        if (!dateString) return "No seleccionada"
        try {
            const date = new Date(dateString)
            return date.toLocaleDateString()
        } catch (e) {
            return dateString
        }
    }

    const openCalendar = (isStart: boolean) => {
        setSelectingStart(isStart)
        setTempStartDate(startDate)
        setTempEndDate(endDate)
        setModalVisible(true)
    }

    const handleDateSelect = (day: DateData) => {
        const selectedDate = day.dateString

        if (selectingStart) {
            setTempStartDate(selectedDate)
            setSelectingStart(false)
            if (tempEndDate && selectedDate > tempEndDate) {
                setTempEndDate(selectedDate)
            }
        } else {
            if (selectedDate >= tempStartDate) {
                setTempEndDate(selectedDate)
                setModalVisible(false)
                onDatesChange(tempStartDate, selectedDate)
            }
        }
    }

    const handleConfirm = () => {
        setModalVisible(false)
        onDatesChange(tempStartDate, tempEndDate)
    }

    const handleCancel = () => {
        setModalVisible(false)
    }

    const getMarkedDates = (): MarkedDates => {
        const markedDates: MarkedDates = {}

        if (tempStartDate && tempEndDate) {
            markedDates[tempStartDate] = {
                startingDay: true,
                selected: true,
                color: "#6200ee",
                textColor: "white",
            }

            markedDates[tempEndDate] = {
                endingDay: true,
                selected: true,
                color: "#6200ee",
                textColor: "white",
            }

            if (tempStartDate !== tempEndDate) {
                const currentDate = new Date(tempStartDate)
                currentDate.setDate(currentDate.getDate() + 1)

                const endDate = new Date(tempEndDate)

                while (currentDate < endDate) {
                    const dateString = currentDate.toISOString().split("T")[0]
                    markedDates[dateString] = {
                        selected: true,
                        color: "#e6d9ff",
                        textColor: "#6200ee",
                    }
                    currentDate.setDate(currentDate.getDate() + 1)
                }
            }
        } else if (tempStartDate) {
            markedDates[tempStartDate] = {
                selected: true,
                color: "#6200ee",
                textColor: "white",
            }
        }

        return markedDates
    }

    return (
        <View style={styles.container}>

            <View style={styles.datePickersContainer}>
                <View style={styles.datePickerColumn}>
                    <Text style={styles.dateLabel}>Fecha de inicio</Text>
                    <TouchableOpacity
                        style={[styles.dateButton, startDateError ? styles.dateButtonError : null]}
                        onPress={() => openCalendar(true)}
                    >
                        <Text style={styles.dateValue}>{formatDisplayDate(startDate)}</Text>
                        <IconButton icon="calendar" size={20} style={styles.calendarIcon} />
                    </TouchableOpacity>
                    {startDateError && <Text style={styles.errorText}>{startDateError}</Text>}
                </View>

                <Text style={styles.separator}>→</Text>

                <View style={styles.datePickerColumn}>
                    <Text style={styles.dateLabel}>Fecha de fin</Text>
                    <TouchableOpacity
                        style={[styles.dateButton, endDateError ? styles.dateButtonError : null]}
                        onPress={() => openCalendar(false)}
                    >
                        <Text style={styles.dateValue}>{formatDisplayDate(endDate)}</Text>
                        <IconButton icon="calendar" size={20} style={styles.calendarIcon} />
                    </TouchableOpacity>
                    {endDateError && <Text style={styles.errorText}>{endDateError}</Text>}
                </View>
            </View>

            <Modal visible={modalVisible} transparent={true} animationType="fade" onRequestClose={handleCancel}>
                <View style={styles.modalOverlay}>
                    <Surface style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {selectingStart ? "Selecciona fecha de inicio" : "Selecciona fecha de fin"}
                        </Text>

                        <Calendar
                            onDayPress={handleDateSelect}
                            markedDates={getMarkedDates()}
                            markingType="period"
                            theme={{
                                todayTextColor: "#6200ee",
                                selectedDayBackgroundColor: "#6200ee",
                                selectedDayTextColor: "#ffffff",
                                arrowColor: "#6200ee",
                            }}
                        />

                        <View style={styles.modalButtons}>
                            <Button onPress={handleCancel} style={styles.modalButton}>
                                Cancelar
                            </Button>
                            <Button
                                mode="contained"
                                onPress={handleConfirm}
                                style={styles.modalButton}
                                disabled={!tempStartDate || !tempEndDate}
                            >
                                Confirmar
                            </Button>
                        </View>
                    </Surface>
                </View>
            </Modal>
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
    datePickersContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    datePickerColumn: {
        flex: 1,
    },
    dateLabel: {
        fontSize: 14,
        marginBottom: 6,
        color: "#666",
    },
    dateButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#f5f5f5",
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        padding: 10,
        marginHorizontal: 4,
    },
    dateButtonError: {
        borderColor: "#f44336",
    },
    dateValue: {
        flex: 1,
        fontSize: 14,
    },
    calendarIcon: {
        margin: 0,
        width: 20,
        height: 20,
    },
    separator: {
        marginHorizontal: 8,
        fontSize: 18,
        color: "#6200ee",
    },
    errorText: {
        color: "#f44336",
        fontSize: 12,
        marginTop: 4,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        padding: 20,
    },
    modalContent: {
        width: "100%",
        padding: 20,
        borderRadius: 16,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 16,
        textAlign: "center",
        color: "#6200ee",
    },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 16,
    },
    modalButton: {
        flex: 1,
        marginHorizontal: 8,
    },
})
