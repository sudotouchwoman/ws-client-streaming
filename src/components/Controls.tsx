import React from 'react'
import Button, { ButtonProps } from '@mui/material/Button'
import { Sync } from '@mui/icons-material'
import { ReadyState } from 'react-use-websocket'
import { GlobalDispatcherContext, SocketNotReady } from '../contexts/WebSocket/WebSocketContext'

const DefaultDiscoverInterval = 10000

type ControlsProps = { readyState: ReadyState }

const Controls: React.FC<ControlsProps> = React.memo(({ readyState }) => {
    const { discover } = React.useContext(GlobalDispatcherContext)

    // auto-discover connections on reconnects
    // try asap and later in intervals (in order to keep the
    // connection active too)
    React.useEffect(() => {
        if (SocketNotReady(readyState)) return
        const id = setInterval(discover, DefaultDiscoverInterval)
        return () => clearInterval(id)
    }, [discover])

    const handleDiscover = React.useCallback(() => {
        if (SocketNotReady(readyState)) return console.warn('send failed: not ready yet', readyState)
        console.log("sends into socket")
        discover()
    }, [discover])

    return (
        <React.Fragment>
            <RefreshButton
                onClick={handleDiscover}
                disabled={SocketNotReady(readyState)}
                disableElevation
            />
        </React.Fragment>
    )
})

const RefreshButton = (props: ButtonProps) => {
    return <Button {...props} startIcon={<Sync />} variant='contained'>
        Refresh
    </Button>
}

export default Controls