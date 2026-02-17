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
exports.CreateCheckInDto = exports.CheckInItemDto = exports.CreateCheckOutDto = exports.CheckOutItemDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class CheckOutItemDto {
    equipmentId;
    quantity;
    condition;
    notes;
}
exports.CheckOutItemDto = CheckOutItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Equipment ID to check out' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CheckOutItemDto.prototype, "equipmentId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Quantity to check out' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CheckOutItemDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Condition at checkout' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CheckOutItemDto.prototype, "condition", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CheckOutItemDto.prototype, "notes", void 0);
class CreateCheckOutDto {
    eventId;
    items;
    notes;
}
exports.CreateCheckOutDto = CreateCheckOutDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCheckOutDto.prototype, "eventId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [CheckOutItemDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CheckOutItemDto),
    __metadata("design:type", Array)
], CreateCheckOutDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCheckOutDto.prototype, "notes", void 0);
class CheckInItemDto {
    equipmentId;
    quantity;
    returnedQuantity;
    condition;
    damageNotes;
}
exports.CheckInItemDto = CheckInItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Equipment ID to check in' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CheckInItemDto.prototype, "equipmentId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Quantity returned' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CheckInItemDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Quantity returned (if different)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CheckInItemDto.prototype, "returnedQuantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.ItemCondition, description: 'Condition at check-in' }),
    (0, class_validator_1.IsEnum)(client_1.ItemCondition),
    __metadata("design:type", String)
], CheckInItemDto.prototype, "condition", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CheckInItemDto.prototype, "damageNotes", void 0);
class CreateCheckInDto {
    eventId;
    items;
    notes;
}
exports.CreateCheckInDto = CreateCheckInDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCheckInDto.prototype, "eventId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [CheckInItemDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CheckInItemDto),
    __metadata("design:type", Array)
], CreateCheckInDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCheckInDto.prototype, "notes", void 0);
//# sourceMappingURL=transactions.dto.js.map