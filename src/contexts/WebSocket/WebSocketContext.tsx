import React, { PropsWithChildren } from "react"
import useWebSocket, { ReadyState, SendMessage } from "react-use-websocket"
import { ErrorMessage, isDiscoveryMessage, isErrorMessage, isSerialMessage, isSocketMessage, SerialMessage } from "./messages"

const defaultAddr = "ws://localhost:8080/ws"
const secondInGolang = 1000000000

// represents a request to websocket API
// websocket server primarily expects messages
// of this format
export interface SocketRequest {
    method: 'read' | 'list' | 'discover'
    serial: string
    baudrate: number
    timeout: number
}

// default request attributes. By default, a
// discover request is performed. It refreshes
const DefaultSockRequest: SocketRequest = {
    method: 'discover',
    serial: '',
    baudrate: 115200,
    timeout: 1
}

// state of context provider
// (it is easier not to add some attributes to the state,
// like the discover method)
interface WebSocketProps {
    url: string
    shouldReconnect: boolean
    subscribed: string[]
}

export const SocketNotReady = (r: ReadyState): boolean => {
    return r !== ReadyState.OPEN
}

interface SerialState {
    accessible: string[]
    lastError: ErrorMessage | null
    lastMessage: SerialMessage | null
}

// represents a websocket connection and
// aux attributes. Provided by WebSocketContext
export interface GlobalState extends WebSocketProps, SerialState {
    readyState: ReadyState
}

// default values for websocket context
const DefaultGlobalStateContext: GlobalState = {
    url: defaultAddr,
    shouldReconnect: true,
    readyState: ReadyState.UNINSTANTIATED,
    accessible: [],
    subscribed: [],
    lastError: null,
    lastMessage: null,
}

// represents callbacks provided by
// dispatcher context
interface SockDispatchable {
    discover: () => void
    perform: (s: SocketRequest) => void
    sendMessage: SendMessage
}

// default stub for global dispatch context
const DefaultGlobalDispatcher: SockDispatchable = {
    discover() { },
    perform(_) { },
    sendMessage: () => { },
}

export const defaultRequest = (x: Partial<SocketRequest>) => {
    const timeout = x?.timeout || DefaultSockRequest.timeout
    return JSON.stringify({ ...DefaultSockRequest, ...x, timeout: timeout * secondInGolang })
}

// context consumed by child components
// provides application-level interface to websocket methods
export const GlobalStateContext = React.createContext<GlobalState>(DefaultGlobalStateContext)
// context consumed by components
// which can mutate global state
export const GlobalDispatcherContext = React.createContext<SockDispatchable>(DefaultGlobalDispatcher)

// wraps WebSocketContext.Provider and tracks its state
const SocketContextProvider = ({ children }: PropsWithChildren) => {
    const [state, setState] = React.useState<SerialState>(
        { accessible: [], lastError: null, lastMessage: null }
    )
    const contextRef = React.useRef<WebSocketProps>(DefaultGlobalStateContext)
    const { sendMessage, readyState, lastJsonMessage } = useWebSocket(
        contextRef.current.url,
        { shouldReconnect: (_) => contextRef.current.shouldReconnect === true }
    )
    const discover = React.useCallback(() => {
        console.log("discovers connections")
        sendMessage(defaultRequest({}))
    }, [readyState, sendMessage, contextRef.current.url])

    const perform = React.useMemo(() => {
        return (s: SocketRequest) => {
            console.log("performs", s)
            sendMessage(defaultRequest(s))
        }
    }, [readyState, sendMessage, contextRef.current.url])

    React.useEffect(() => {
        console.log(state)
    })

    React.useEffect(() => {
        // drop the list of accessible serials
        // if on discovery none was found
        if (SocketNotReady(readyState)) {
            setState((o) => { return { ...o, accessible: [] } })
        }
    }, [readyState, contextRef.current.url])

    // handle socket message based on its type
    const handleSocketMessage = (m: any) => {
        if (isDiscoveryMessage(m)) {
            // update list of serials
            console.log("discovered", m.serials)
            return setState((s) => { return { ...s, accessible: m.serials } })
        }
        if (isErrorMessage(m)) {
            console.log("got error", m)
            return setState((s) => { return { ...s, lastError: m } })
        }
        if (isSerialMessage(m)) {
            console.log("got message", m)
            return setState((s) => { return { ...s, lastMessage: m } })
        }
    }

    // side effects: whenever new message has arrived,
    // parse it and decide which of the serials to update
    // hence this logic is abstracted by this component
    React.useEffect(() => {
        if (!lastJsonMessage) return
        if (!isSocketMessage(lastJsonMessage)) return console.warn("unknown message:", lastJsonMessage)
        handleSocketMessage(lastJsonMessage)
    }, [lastJsonMessage])

    return (
        <GlobalStateContext.Provider value={
            {
                ...contextRef.current,
                ...state,
                readyState: readyState,
            }
        }>
            <GlobalDispatcherContext.Provider value={
                {
                    discover: discover,
                    perform: perform,
                    sendMessage: sendMessage,
                }
            }>
                {children}
            </GlobalDispatcherContext.Provider>
        </GlobalStateContext.Provider>
    )
}

export default SocketContextProvider
