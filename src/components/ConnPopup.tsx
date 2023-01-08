import { Button, Dialog, DialogActions, DialogContent, InputLabel, MenuItem, Select } from '@mui/material'
import React from 'react'
import { GlobalDispatcherContext } from '../contexts/WebSocket/WebSocketContext'

type ConnPopupProps = {
    conn: string
    baudrate?: number
    onClose: () => void
}

// Popup displayed when user selects a serial to connect to
// with some options like baudrate or parity
const ConnPopup = ({ conn, baudrate, onClose }: ConnPopupProps) => {
    const [Baudrate, setBaudrate] = React.useState(baudrate || 9600)
    const { perform } = React.useContext(GlobalDispatcherContext)

    const baudrates = [9600, 115200]
    const handleConnect = () => {
        // send a read request
        perform({
            serial: conn,
            baudrate: Baudrate,
            method: 'read',
            timeout: 1
        })
        onClose()
    }

    return (
        <Dialog open={true}>
            <DialogContent>
                <InputLabel id="conn-popup-baudrate-label">Baudrate</InputLabel>
                <Select
                    onChange={(e) => setBaudrate(Number(e.target.value))}
                    value={Baudrate}
                    labelId='conn-popup-baudrate-label'>
                    {baudrates.map((value) => {
                        return <MenuItem key={value} value={value}>{value}</MenuItem>
                    })}
                </Select>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleConnect}>Connect</Button>
            </DialogActions>
        </Dialog>
    )
}

export default ConnPopup