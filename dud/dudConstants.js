
class DudClientRequest {}

class DudServerResponse {
	success = false
    error = undefined
}


class SaveStampRequest extends DudClientRequest {}
class SaveStampResponse extends DudServerResponse {}

class CreateStampRequest extends DudClientRequest {}
class CreateStampResponse extends DudServerResponse {}


class ReadStampRequest extends DudClientRequest {}
class ReadStampResponse extends DudServerResponse {}


class UnpackStampRequest extends DudClientRequest {}
class UnpackStampResponse extends DudServerResponse {}
