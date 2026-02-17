"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompleteMaintenanceDto = exports.UpdateMaintenanceStatusDto = exports.UpdateMaintenanceTicketDto = exports.CreateMaintenanceTicketDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class CreateMaintenanceTicketDto {
    equipmentId;
    title;
    description;
    reportedIssue;
    priority;
}
exports.CreateMaintenanceTicketDto = CreateMaintenanceTicketDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMaintenanceTicketDto.prototype, "equipmentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMaintenanceTicketDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMaintenanceTicketDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMaintenanceTicketDto.prototype, "reportedIssue", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.MaintenancePriority }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.MaintenancePriority),
    __metadata("design:type", String)
], CreateMaintenanceTicketDto.prototype, "priority", void 0);
class UpdateMaintenanceTicketDto extends (0, swagger_1.PartialType)(CreateMaintenanceTicketDto) {
    assignedToId;
    diagnosis;
    repairNotes;
    vendorName;
}
exports.UpdateMaintenanceTicketDto = UpdateMaintenanceTicketDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMaintenanceTicketDto.prototype, "assignedToId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMaintenanceTicketDto.prototype, "diagnosis", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMaintenanceTicketDto.prototype, "repairNotes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMaintenanceTicketDto.prototype, "vendorName", void 0);
class UpdateMaintenanceStatusDto {
    status;
    notes;
}
exports.UpdateMaintenanceStatusDto = UpdateMaintenanceStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.MaintenanceStatus }),
    (0, class_validator_1.IsEnum)(client_1.MaintenanceStatus),
    __metadata("design:type", String)
], UpdateMaintenanceStatusDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMaintenanceStatusDto.prototype, "notes", void 0);
class CompleteMaintenanceDto {
    repairNotes;
    diagnosis;
    setAvailable;
}
exports.CompleteMaintenanceDto = CompleteMaintenanceDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompleteMaintenanceDto.prototype, "repairNotes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompleteMaintenanceDto.prototype, "diagnosis", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Set equipment back to available after repair',
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CompleteMaintenanceDto.prototype, "setAvailable", void 0);
//# sourceMappingURL=maintenance.dto.js.map