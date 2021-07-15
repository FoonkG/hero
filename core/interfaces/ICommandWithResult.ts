export default interface ICommandWithResult {
  id: number;
  tabId: number;
  frameId: number;
  label: string;
  name: string;
  args?: string;
  startDate: number;
  endDate?: number;
  duration: number;
  isError: boolean;
  result: any;
  resultType?: string;
  frameIdPath?: string;
  resultNodeIds?: number[];
  resultNodeType?: string;
  failedJsPathStepIndex?: number;
  failedJsPathStep?: string;
}
