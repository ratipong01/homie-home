import type {
  UserRecord,
  HouseRecord,
  HouseMemberRecord,
  PerspectiveAliasRecord,
  RecoveryKeyRecord,
  TaskRecord,
  TaskSubItemRecord,
  TaskSplitItemRecord,
  HandoverLogRecord,
} from './database.js';

export class MemoryStore {
  static users = new Map<string, UserRecord>();
  static phoneIndex = new Map<string, string>(); // phone -> userId
  static houses = new Map<string, HouseRecord>();
  static houseMembers = new Map<string, HouseMemberRecord>();
  static perspectiveAliases = new Map<string, PerspectiveAliasRecord>(); // `${viewerId}_${targetId}` -> record
  static recoveryKeys = new Map<string, RecoveryKeyRecord>();
  static tasks = new Map<string, TaskRecord>();
  static taskSubItems = new Map<string, TaskSubItemRecord>();
  static taskSplitItems = new Map<string, TaskSplitItemRecord>();
  static handoverLogs = new Map<string, HandoverLogRecord>();
}
