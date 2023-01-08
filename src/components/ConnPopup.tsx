import { Box, Button, Dialog, DialogActions, DialogContent, InputLabel, MenuItem, Select } from '@mui/material'
import React from 'react'
import { GlobalDispatcherContext } from '../contexts/WebSocket/WebSocketContext'

type ConnPopupProps = {
    open: boolean
    conn: string
    baudrate?: number
    onClose: () => void
}

// Popup displayed when user selects a serial to connect to
// with some options like baudrate or parity
const ConnPopup = ({ open, conn, baudrate, onClose }: ConnPopupProps) => {
    const [Baudrate, setBaudrate] = React.useState(baudrate || 9600)
    const [ReadTimeout, setReadTimeout] = React.useState(1)
    const { perform } = React.useContext(GlobalDispatcherContext)

    const baudrates = [9600, 115200]
    const timeouts = [1, 2, 5, 10, 60]

    const handleConnect = () => {
        // send a read request
        perform({
            serial: conn,
            baudrate: Baudrate,
            method: 'read',
            timeout: ReadTimeout
        })
        onClose()
    }

    return (
        <Dialog open={open}>
            <DialogContent>
                <Box component='form' sx={{ display: 'flex', flexWrap: 'wrap' }}>
                    <InputLabel id="conn-popup-baudrate-label">Baudrate</InputLabel>
                    <Select
                        onChange={(e) => setBaudrate(Number(e.target.value))}
                        value={Baudrate}
                        labelId='conn-popup-baudrate-label'>
                        {baudrates.map((value) => {
                            return <MenuItem key={value} value={value}>{value}</MenuItem>
                        })}
                    </Select>

                    <InputLabel id="conn-popup-timeout-label">Timeout</InputLabel>
                    <Select
                        onChange={(e) => setReadTimeout(Number(e.target.value))}
                        value={ReadTimeout}
                        labelId='conn-popup-timeout-label'>
                        {timeouts.map((value) => {
                            return <MenuItem key={value} value={value}>{value}s</MenuItem>
                        })}
                    </Select>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleConnect}>Connect</Button>
            </DialogActions>
        </Dialog>
    )
}

export default ConnPopup