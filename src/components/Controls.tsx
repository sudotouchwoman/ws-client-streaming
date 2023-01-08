import React from 'react'
import Button, { ButtonProps } from '@mui/material/Button'
import { Sync } from '@mui/icons-material'
import { ReadyState } from 'react-use-websocket'
import { GlobalDispatcherContext, SocketNotReady } from '../contexts/WebSocket/WebSocketContext'

const DefaultDiscoverInterval = 10000

type Props = {
    readyState: ReadyState
}

const Controls = ({ readyState }: Props) => {
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
            />
        </React.Fragment>
    )
}

const RefreshButton = React.memo((props: ButtonProps) => {
    return <Button {...props}>
        <Sync/>
    </Button>
})

export default Controls