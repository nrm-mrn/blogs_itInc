import { ObjectId } from "mongodb";
import { ApiReqModel, ApiRequest } from "./apiRequest.entity";
import { ApiRequestsRepository } from "./apiRequest.repository";
import { CreateRequestDto } from "./apiRequest.types";
import { inject, injectable } from "inversify";

@injectable()
export class ApiRequestService {
  constructor(
    @inject(ApiRequestsRepository)
    private readonly apiRequestRepository: ApiRequestsRepository
  ) { }
  async saveRequest(req: CreateRequestDto): Promise<ObjectId> {
    const reqInput: ApiRequest = new ApiRequest(
      req.ip,
      req.URL,
    )
    const newReq = new ApiReqModel({
      ...reqInput
    })
    return this.apiRequestRepository.save(newReq);
  }

  async getDocsCountForPeriod(ip: string, url: string, seconds: number): Promise<number> {
    const reqs = await this.apiRequestRepository.getRequestsForPeriod(
      ip,
      url,
      seconds
    )

    return reqs.length
  }
}
