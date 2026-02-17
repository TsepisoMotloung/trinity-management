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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const finance_service_1 = require("./finance.service");
const finance_dto_1 = require("./dto/finance.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let FinanceController = class FinanceController {
    financeService;
    constructor(financeService) {
        this.financeService = financeService;
    }
    createQuote(dto, userId) {
        return this.financeService.createQuote(dto, userId);
    }
    findAllQuotes(skip, take, status, clientId, search) {
        return this.financeService.findAllQuotes({
            skip: skip ? parseInt(skip) : undefined,
            take: take ? parseInt(take) : undefined,
            status: status,
            clientId,
            search,
        });
    }
    findOneQuote(id) {
        return this.financeService.findOneQuote(id);
    }
    updateQuote(id, dto, userId) {
        return this.financeService.updateQuote(id, dto, userId);
    }
    updateQuoteStatus(id, dto, userId) {
        return this.financeService.updateQuoteStatus(id, dto, userId);
    }
    deleteQuote(id, userId) {
        return this.financeService.deleteQuote(id, userId);
    }
    createInvoice(dto, userId) {
        return this.financeService.createInvoice(dto, userId);
    }
    findAllInvoices(skip, take, status, clientId, search) {
        return this.financeService.findAllInvoices({
            skip: skip ? parseInt(skip) : undefined,
            take: take ? parseInt(take) : undefined,
            status: status,
            clientId,
            search,
        });
    }
    findOneInvoice(id) {
        return this.financeService.findOneInvoice(id);
    }
    updateInvoice(id, dto, userId) {
        return this.financeService.updateInvoice(id, dto, userId);
    }
    updateInvoiceStatus(id, dto, userId) {
        return this.financeService.updateInvoiceStatus(id, dto, userId);
    }
    deleteInvoice(id, userId) {
        return this.financeService.deleteInvoice(id, userId);
    }
    createPayment(dto, userId) {
        return this.financeService.createPayment(dto, userId);
    }
    findAllPayments(skip, take, invoiceId, clientId) {
        return this.financeService.findAllPayments({
            skip: skip ? parseInt(skip) : undefined,
            take: take ? parseInt(take) : undefined,
            invoiceId,
            clientId,
        });
    }
    findOnePayment(id) {
        return this.financeService.findOnePayment(id);
    }
    deletePayment(id, userId) {
        return this.financeService.deletePayment(id, userId);
    }
    getFinancialSummary(startDate, endDate) {
        return this.financeService.getFinancialSummary({ startDate, endDate });
    }
};
exports.FinanceController = FinanceController;
__decorate([
    (0, common_1.Post)('quotes'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new quote' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [finance_dto_1.CreateQuoteDto, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "createQuote", null);
__decorate([
    (0, common_1.Get)('quotes'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all quotes' }),
    (0, swagger_1.ApiQuery)({ name: 'skip', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'take', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'clientId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    __param(0, (0, common_1.Query)('skip')),
    __param(1, (0, common_1.Query)('take')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('clientId')),
    __param(4, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "findAllQuotes", null);
__decorate([
    (0, common_1.Get)('quotes/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a quote by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "findOneQuote", null);
__decorate([
    (0, common_1.Put)('quotes/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a quote' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, finance_dto_1.UpdateQuoteDto, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "updateQuote", null);
__decorate([
    (0, common_1.Patch)('quotes/:id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Update quote status' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, finance_dto_1.UpdateQuoteStatusDto, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "updateQuoteStatus", null);
__decorate([
    (0, common_1.Delete)('quotes/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a quote' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "deleteQuote", null);
__decorate([
    (0, common_1.Post)('invoices'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new invoice' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [finance_dto_1.CreateInvoiceDto, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "createInvoice", null);
__decorate([
    (0, common_1.Get)('invoices'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all invoices' }),
    (0, swagger_1.ApiQuery)({ name: 'skip', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'take', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'clientId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    __param(0, (0, common_1.Query)('skip')),
    __param(1, (0, common_1.Query)('take')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('clientId')),
    __param(4, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "findAllInvoices", null);
__decorate([
    (0, common_1.Get)('invoices/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get an invoice by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "findOneInvoice", null);
__decorate([
    (0, common_1.Put)('invoices/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update an invoice' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, finance_dto_1.UpdateInvoiceDto, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "updateInvoice", null);
__decorate([
    (0, common_1.Patch)('invoices/:id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Update invoice status' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, finance_dto_1.UpdateInvoiceStatusDto, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "updateInvoiceStatus", null);
__decorate([
    (0, common_1.Delete)('invoices/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete an invoice' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "deleteInvoice", null);
__decorate([
    (0, common_1.Post)('payments'),
    (0, swagger_1.ApiOperation)({ summary: 'Record a payment' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [finance_dto_1.CreatePaymentDto, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "createPayment", null);
__decorate([
    (0, common_1.Get)('payments'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all payments' }),
    (0, swagger_1.ApiQuery)({ name: 'skip', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'take', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'invoiceId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'clientId', required: false }),
    __param(0, (0, common_1.Query)('skip')),
    __param(1, (0, common_1.Query)('take')),
    __param(2, (0, common_1.Query)('invoiceId')),
    __param(3, (0, common_1.Query)('clientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "findAllPayments", null);
__decorate([
    (0, common_1.Get)('payments/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a payment by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "findOnePayment", null);
__decorate([
    (0, common_1.Delete)('payments/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a payment' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "deletePayment", null);
__decorate([
    (0, common_1.Get)('summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Get financial summary' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getFinancialSummary", null);
exports.FinanceController = FinanceController = __decorate([
    (0, swagger_1.ApiTags)('Finance'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('finance'),
    __metadata("design:paramtypes", [finance_service_1.FinanceService])
], FinanceController);
//# sourceMappingURL=finance.controller.js.map