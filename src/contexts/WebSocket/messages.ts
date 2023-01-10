// emitted by server in response to connection
// discover requests
export type DiscoverMessage = {
    iat: string
    serials: string[]
}

export const isDiscoveryMessage = (x: any): x is DiscoverMessage => {
    const casted = x as DiscoverMessage
    return (typeof casted.iat === 'string' && casted.serials !== undefined)
}

// emitted by server on encountered errors
export type ErrorMessage = {
    serial?: string
    error: string
}

export const isErrorMessage = (x: any): x is ErrorMessage => {
    const casted = x as ErrorMessage
    return (typeof casted.error === 'string' && (casted.serial === undefined || typeof casted.serial === 'string'))
}

// message emitted by server on serial updates
export type SerialMessage = {
    serial: string
    iat: string
    message: string
}

export const isSerialMessage = (x: any): x is SerialMessage => {
    const casted = x as SerialMessage
    return (!!casted.serial && !!casted.message && !!casted.iat)
}

// union type for all messages emitted by server
export type SocketMessage = SerialMessage & DiscoverMessage & ErrorMessage

// type guard for socket message
export const isSocketMessage = (x: any): x is SocketMessage => {
    return (isSerialMessage(x) || isDiscoveryMessage(x) || isErrorMessage(x))
}

// emitted by client and sent to server
export type SocketClientMessage = {
    message: string
    serial: string
}

export const isSocketClientMessage = (x: any): x is SocketClientMessage => {
    const casted = x as SocketClientMessage
    return (typeof casted.message === 'string' && typeof casted.serial === 'string')
}
